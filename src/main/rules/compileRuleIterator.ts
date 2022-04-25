import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {createReaderCallCode, NO_MATCH, seq} from '../readers';
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

  const stateVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();
  const streamingVar = createVar();

  const stageIndexVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();
  const chunkOffsetVar = createVar();

  const tokenCallbackVar = createVar();
  const errorCallbackVar = createVar();
  const unrecognizedTokenCallbackVar = createVar();

  const prevRuleIndexVar = createVar();
  const prevRuleTypeVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();

  const stagesVar = createVar();

  const {stages, branchesByStageIndex, branches} = tree;
  const bindings: Binding[] = [[stagesVar, stages]];

  const createRuleIteratorBranchesCode = (branches: RuleBranch<Type, Stage, Context>[], branchOffsetVar: Var, stagesEnabled: boolean): Code => {

    const branchResultVar = createVar();

    const code: Code[] = [
      'var ', branchResultVar, ';',
    ];

    for (const branch of branches) {

      code.push(
          createReaderCallCode(seq(...branch.readers), chunkVar, branchOffsetVar, contextVar, branchResultVar, bindings),
          'if(', branchResultVar, '!==', NO_MATCH, '&&', branchResultVar, '!==', branchOffsetVar, '){',
      );

      // Apply nested branches
      if (branch.children) {
        code.push(createRuleIteratorBranchesCode(branch.children, branchResultVar, stagesEnabled));
      }

      const {rule} = branch;

      // If there's no termination rule then exit
      if (!rule) {
        code.push('}');
        continue;
      }

      const ruleTypeVar = createVar();
      const ruleToCallbackVar = createVar();

      bindings.push([ruleTypeVar, rule.type]);

      if (typeof rule.to === 'function') {
        bindings.push([ruleToCallbackVar, rule.to]);
      }

      code.push([

        // Emit an error
        'if(', branchResultVar, '<0){',
        errorCallbackVar, '&&', errorCallbackVar, '(', ruleTypeVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', branchResultVar, ',', contextVar, ');',
        'return}',

        // Emit confirmed token
        'if(', prevRuleIndexVar, '!==-1){',
        tokenCallbackVar, '(', prevRuleTypeVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ');',
        prevRuleIndexVar, '=-1}',

        // If stagesEnabled === true then stageIndex !== -1
        stagesEnabled ? [stateVar, '.stage=', stagesVar, '[', stageIndexVar, '];'] : '',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        rule.silent ? '' : [
          prevRuleIndexVar, '=', branch.ruleIndex, ';',
          prevRuleTypeVar, '=', ruleTypeVar, ';',
        ],

        rule.to === undefined ? '' : typeof rule.to === 'function'
            ? [stageIndexVar, '=', stagesVar, '.indexOf(', ruleToCallbackVar, '(', chunkVar, ',', nextOffsetVar, ',', branchResultVar, '-', nextOffsetVar, ',', contextVar, '));']
            : [stageIndexVar, '=', stages.indexOf(rule.to), ';'],

        nextOffsetVar, '=', branchResultVar, ';',

        // Restart the looping over characters in the input chunk
        'continue}',
      ]);

    }

    return code;
  };

  const code: Code = [
    'var ',
    stageIndexVar, '=', stagesVar, '.indexOf(', stateVar, '.stage),',
    chunkVar, '=', stateVar, '.chunk,',
    offsetVar, '=', stateVar, '.offset,',
    chunkOffsetVar, '=', stateVar, '.chunkOffset,',

    tokenCallbackVar, '=', handlerVar, '.token,',
    errorCallbackVar, '=', handlerVar, '.error,',
    unrecognizedTokenCallbackVar, '=', handlerVar, '.unrecognizedToken,',

    prevRuleIndexVar, '=-1,',
    prevRuleTypeVar, ',',
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length;',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    // Apply rules from the current stage
    branchesByStageIndex.length ? [
      'switch(', stageIndexVar, '){',
      branchesByStageIndex.map((branches, stageIndex) => [
        'case ', stageIndex, ':', createRuleIteratorBranchesCode(branches, nextOffsetVar, true),
        'break;'
      ]),
      '}',
    ] : createRuleIteratorBranchesCode(branches, nextOffsetVar, false),

    'break}',

    'if(', streamingVar, ')return;',

    // Emit trailing unconfirmed token
    'if(', prevRuleIndexVar, '!==-1){',
    tokenCallbackVar, '(', prevRuleTypeVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ');',
    '}',

    // Update stage only if stages are enabled
    branchesByStageIndex.length ? [stateVar, '.stage=', stagesVar, '[', stageIndexVar, '];'] : '',
    stateVar, '.offset=', nextOffsetVar, ';',

    // Trigger unrecognized token
    nextOffsetVar, '!==', chunkLengthVar,
    '&&', unrecognizedTokenCallbackVar,
    '&&', unrecognizedTokenCallbackVar, '(', chunkOffsetVar, '+', nextOffsetVar, ',', contextVar, ');',
  ];

  return compileFunction<RuleIterator<Type, Stage, Context>>([stateVar, handlerVar, contextVar, streamingVar], code, bindings);
}
