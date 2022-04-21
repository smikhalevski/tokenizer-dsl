import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {createReaderCallCode, NO_MATCH, seq} from '../readers';
import {RuleIteratorBranch, RuleIteratorPlan} from './createRuleIteratorPlan';
import {TokenHandler} from './rule-types';

export interface RuleIteratorState<Stage> {

  /**
   * The current tokenizer stage.
   */
  stage: Stage;

  /**
   * The chunk that is being processed.
   */
  chunk: string;

  /**
   * The offset in the {@link chunk} from which the tokenization should proceed.
   */
  offset: number;

  /**
   * The offset of the {@link chunk} in the stream.
   */
  chunkOffset: number;
}

/**
 * The callback that reads tokens from the input defined by iterator state.
 */
export type RuleIterator<Type, Stage, Context> = (state: RuleIteratorState<Stage>, streaming: boolean, handler: TokenHandler<Type>, context: Context) => void;

/**
 * Compiles tokens into a token iterator function.
 */
export function compileRuleIterator<Type, Stage, Context>(plan: RuleIteratorPlan<Type, Stage, Context>): RuleIterator<Type, Stage, Context> {

  const stateVar = createVar();
  const streamingVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();

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

  const {stages, branchesByStageIndex, branches} = plan;
  const bindings: Binding[] = [[stagesVar, stages]];

  const createRuleIteratorBranchesCode = (branches: RuleIteratorBranch<Type, Stage, Context>[], branchOffsetVar: Var): Code => {

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
        code.push(createRuleIteratorBranchesCode(branch.children, branchResultVar));
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
        errorCallbackVar, '&&', errorCallbackVar, '(', ruleTypeVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', branchResultVar, ');',
        'return}',

        // Emit confirmed token
        'if(', prevRuleIndexVar, '!==-1){',
        tokenCallbackVar, '(', prevRuleTypeVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ');',
        prevRuleIndexVar, '=-1}',

        stateVar, '.stage=', stagesVar, '[', stageIndexVar, '];',
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
        'case ', stageIndex, ':', createRuleIteratorBranchesCode(branches, nextOffsetVar),
        'break;'
      ]),
      '}',
    ] : createRuleIteratorBranchesCode(branches, nextOffsetVar),

    'break}',

    'if(', streamingVar, ')return;',

    // Emit trailing unconfirmed token
    'if(', prevRuleIndexVar, '!==-1){',
    tokenCallbackVar, '(', prevRuleTypeVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ');',
    stateVar, '.stage=', stagesVar, '[', stageIndexVar, '];',
    stateVar, '.offset=', nextOffsetVar, ';',
    '}',

    // Trigger unrecognized token
    nextOffsetVar, '!==', chunkLengthVar,
    '&&', unrecognizedTokenCallbackVar,
    '&&', unrecognizedTokenCallbackVar, '(', chunkOffsetVar, '+', nextOffsetVar, ');',
  ];

  return compileFunction<RuleIterator<Type, Stage, Context>>([stateVar, streamingVar, handlerVar, contextVar], code, bindings);
}
