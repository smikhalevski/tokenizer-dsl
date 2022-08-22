import { Binding, Code, CodeBindings, compileFunction, Var } from 'codedegen';
import { createVar, die, isCallable, isExternalValue } from '../utils';
import { RuleBranch, RuleTree } from './createRuleTree';
import { RuleIterator } from './rule-types';
import { createCodeBindings, createReaderCallCode } from '../readers/reader-utils';
import { seq } from '../readers';

/**
 * Compiles rules into a function that applies them one after another in a loop.
 */
export function compileRuleIterator<Type, Stage, Context>(tree: RuleTree<Type, Stage, Context>): RuleIterator<Type, Stage, Context> {

  const stateVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();
  const streamingVar = createVar();

  const { code, bindings } = compileRuleIteratorCodeBindings(tree, stateVar, handlerVar, contextVar, streamingVar);

  if (bindings && bindings.some(([, value]) => isExternalValue(value))) {
    die('Cannot use external value at runtime');
  }

  return compileFunction<RuleIterator<Type, Stage, Context>>([stateVar, handlerVar, contextVar, streamingVar], code, bindings);
}

export function compileRuleIteratorCodeBindings(tree: RuleTree<any, any, any>, stateVar: Var, handlerVar: Var, contextVar: Var, streamingVar: Var): CodeBindings {

  const { branchesOnStage, branches } = tree;

  const stageVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();

  const tokenPendingVar = createVar();
  const pendingTokenTypeVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();

  const stagesEnabled = tree.stages.length !== 0;
  const stageVars: Var[] = [];
  const bindings: Binding[] = [];

  for (const stage of tree.stages) {
    const stageVar = createVar();
    stageVars.push(stageVar);
    bindings.push([stageVar, stage]);
  }

  const createRuleIteratorBranchesCode = (branches: RuleBranch<any, any, any>[], branchOffsetVar: Var): Code => {

    const branchResultVar = createVar();

    const code: Code[] = ['var ', branchResultVar, ';'];

    for (const branch of branches) {
      const { rule } = branch;

      // Read branch
      code.push(
        createReaderCallCode(seq(...branch.readers), chunkVar, branchOffsetVar, contextVar, branchResultVar, bindings),
        'if(', branchResultVar, '>', branchOffsetVar, '){',
      );

      // Apply nested branches
      if (branch.children) {
        code.push(createRuleIteratorBranchesCode(branch.children, branchResultVar));
      }

      // If there's no termination rule then exit
      if (!rule) {
        code.push('}');
        continue;
      }

      const { type: tokenType, to: nextStage, silent } = rule;

      const valueProviderArgsCode: Code = ['(', chunkVar, ',', nextOffsetVar, ',', branchResultVar, '-', nextOffsetVar, ',', contextVar, ',', stateVar, ')'];

      let tokenTypeCode: Code = '';
      let nextStageCode: Code = '';

      if (!silent) {
        tokenTypeCode = [tokenPendingVar, '=true;'];

        if (tokenType !== undefined) {
          const tokenTypeVar = createVar();
          bindings.push([tokenTypeVar, tokenType]);

          tokenTypeCode.push(pendingTokenTypeVar, '=', tokenTypeVar, isCallable(tokenType) ? valueProviderArgsCode : '', ';');
        } else {
          tokenTypeCode.push(pendingTokenTypeVar, '=undefined;');
        }
      }

      if (nextStage !== undefined) {
        const nextStageVar = createVar();
        bindings.push([nextStageVar, nextStage]);

        nextStageCode = [stageVar, '=', nextStageVar, isCallable(nextStage) ? valueProviderArgsCode : '', ';'];
      }

      code.push([

        // Emit confirmed token
        'if(', tokenPendingVar, '){',
        handlerVar, '(', pendingTokenTypeVar, ',', chunkVar, ',', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ',', stateVar, ');',
        tokenPendingVar, '=false}',

        stagesEnabled ? [stateVar, '.stage=', stageVar, ';'] : '',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        tokenTypeCode,
        nextStageCode,

        nextOffsetVar, '=', branchResultVar, ';',

        // Restart the looping over characters in the input chunk
        'continue}',
      ]);

    }

    return code;
  };

  const code: Code = [
    'var ',
    stagesEnabled ? [stageVar, '=', stateVar, '.stage,'] : '',
    chunkVar, '=', stateVar, '.chunk,',
    offsetVar, '=', stateVar, '.offset,',

    tokenPendingVar, '=false,',
    pendingTokenTypeVar, ',',
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length;',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    // Apply rules available on the current stage
    stagesEnabled
      ? [
        'switch(', stageVar, '){',
        branchesOnStage.map((branches, i) => [
          'case ', stageVars[i], ':',
          createRuleIteratorBranchesCode(branches, nextOffsetVar),
          'break;'
        ]),
        '}',
      ]
      : createRuleIteratorBranchesCode(branches, nextOffsetVar),

    'break}',

    'if(', streamingVar, ')return;',

    // Emit last unconfirmed token
    'if(', tokenPendingVar, '){',
    handlerVar, '(', pendingTokenTypeVar, ',', chunkVar, ',', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ',', stateVar, ');',
    '}',

    // Update unconfirmed stage and offset
    stagesEnabled ? [stateVar, '.stage=', stageVar, ';'] : '',
    stateVar, '.offset=', nextOffsetVar, ';',
  ];

  return createCodeBindings(code, bindings);
}
