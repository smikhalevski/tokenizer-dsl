import {Binding, Code, compileFunction, Var} from 'codedegen';
import {createReaderCallCode, seq} from '../readers';
import {createVar} from '../utils';
import {RuleBranch, RuleTree} from './createRuleTree';
import {TokenHandler, TokenizerState} from './rule-types';

/**
 * The callback that reads tokens from the input defined by iterator state.
 */
export type RuleIterator<Type, Stage, Context> = (state: TokenizerState<Stage>, handler: TokenHandler<Type, Context>, context: Context, streaming?: boolean) => void;

/**
 * Compiles rules into a function that applies them one after another in a loop.
 */
export function compileRuleIterator<Type, Stage, Context>(tree: RuleTree<Type, Stage, Context>): RuleIterator<Type, Stage, Context> {

  const {stages, branchesOnStage, branches} = tree;

  const stateVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();
  const streamingVar = createVar();

  const stageVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();

  const tokenPendingVar = createVar();
  const pendingTokenTypeVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();

  const stagesVar = createVar();

  const stagesEnabled = stages.length !== 0;
  const stagesInlined = stages.every(Number.isInteger);

  const bindings: Binding[] = stagesInlined ? [] : [[stagesVar, stages]];

  const createRuleIteratorBranchesCode = (branches: RuleBranch<Type, Stage, Context>[], branchOffsetVar: Var): Code => {

    const branchResultVar = createVar();

    const code: Code[] = ['var ', branchResultVar, ';'];

    for (const branch of branches) {
      const {rule} = branch;

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

      const {type, to} = rule;

      const typeVar = createVar();
      const toCallbackVar = createVar();

      const typeInlined = Number.isInteger(type);
      const toCallable = typeof to === 'function';

      if (!typeInlined) {
        bindings.push([typeVar, type]);
      }
      if (toCallable) {
        bindings.push([toCallbackVar, to]);
      }

      code.push([

        // Emit confirmed token
        'if(', tokenPendingVar, '){',
        handlerVar, '(', pendingTokenTypeVar, ',', chunkVar, ',', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ',', stateVar, ');',
        tokenPendingVar, '=false}',

        // If stagesEnabled then stageIndex is never -1 so no out-of-bounds check is required
        stagesEnabled ? [stateVar, '.stage=', stagesInlined ? stageVar : [stagesVar, '[', stageVar, ']'], ';'] : '',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        rule.silent ? '' : [
          tokenPendingVar, '=true;',
          pendingTokenTypeVar, '=', typeInlined ? type as unknown as number : typeVar, ';',
        ],

        to === undefined ? '' : toCallable
            ? [stageVar, '=', stagesInlined ? '(' : [stagesVar, '.indexOf('], toCallbackVar, '(', chunkVar, ',', nextOffsetVar, ',', branchResultVar, '-', nextOffsetVar, ',', contextVar, ',', stateVar, '));']
            : [stageVar, '=', stagesInlined ? to as unknown as number : stages.indexOf(to), ';'],

        nextOffsetVar, '=', branchResultVar, ';',

        // Restart the looping over characters in the input chunk
        'continue}',
      ]);

    }

    return code;
  };

  const code: Code = [
    'var ',
    stagesEnabled ? [stageVar, '=', stagesInlined ? '(' : [stagesVar, '.indexOf('], stateVar, '.stage),'] : '',
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
          branchesOnStage.map((branches, stageIndex) => [
            'case ', stagesInlined ? stages[stageIndex] as unknown as number : stageIndex, ':',
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
    stagesEnabled ? [stateVar, '.stage=', stagesInlined ? stageVar : [stagesVar, '[', stageVar, ']'], ';'] : '',
    stateVar, '.offset=', nextOffsetVar, ';',
  ];

  return compileFunction<RuleIterator<Type, Stage, Context>>([stateVar, handlerVar, contextVar, streamingVar], code, bindings);
}
