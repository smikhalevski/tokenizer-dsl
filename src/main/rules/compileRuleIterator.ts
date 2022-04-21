import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {createReaderCallCode, NO_MATCH, seq} from '../readers';
import {RuleIterationPlan, RulePlan} from './createRuleIterationPlan';
import {RuleHandler} from './rule-types';

/**
 * The mutable iterator state.
 */
export interface RuleIteratorState {

  /**
   * The index of the current tokenizer stage. A positive integer or -1 if stage is undefined.
   */
  stageIndex: number;

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
export interface RuleIterator<S, C> {

  (state: RuleIteratorState, streaming: boolean, handler: RuleHandler<S, C>, context: C): void;

  /**
   * The list of unique stages that are used by tokens that comprise this iterator.
   */
  stages: readonly S[];
}

/**
 * Compiles tokens into a token iterator function.
 */
export function compileRuleIterator<S, C>(iterationPlan: RuleIterationPlan<S, C>): RuleIterator<S, C> {

  const bindings: Binding[] = [];
  const {stages, stagePlans, defaultPlans, stagesComputed} = iterationPlan;

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

  const lastMatchedReaderVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();

  const stagesVar = createVar();

  // If there are rules that use callbacks to compute nextStage, then stages must be available in the iterator to
  // convert the returned stage to its index
  if (stagesComputed) {
    bindings.push([stagesVar, stages]);
  }

  const createRulePlansCode = (plans: RulePlan<S, C>[], prefixOffsetVar: Var): Code => {

    const readerResultVar = createVar();

    const code: Code[] = [
      'var ', readerResultVar, ';',
    ];

    for (const {prefix, children, rule} of plans) {

      code.push(
          // Read the prefix
          createReaderCallCode(seq(...prefix), chunkVar, prefixOffsetVar, contextVar, readerResultVar, bindings),

          // Proceed if the prefix reader read something
          'if(', readerResultVar, '!==', NO_MATCH, '&&', readerResultVar, '!==', prefixOffsetVar, '){',
      );

      // Apply nested plans
      if (children) {
        code.push(createRulePlansCode(children, readerResultVar));
      }

      // If there's no termination rule then exit
      if (!rule) {
        code.push('}');
        continue;
      }

      // Apply plan rule
      const ruleVar = createVar();

      bindings.push([ruleVar, rule]);

      code.push([

        // Emit an error if a reader returned a negative offset
        'if(', readerResultVar, '<0){',
        errorCallbackVar, '(', ruleVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', readerResultVar, ');',
        'return}',

        // Emit confirmed token
        'if(', lastMatchedReaderVar, '!==null){',
        tokenCallbackVar, '(', lastMatchedReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ');',
        lastMatchedReaderVar, '=null}',

        stateVar, '.stageIndex=', stageIndexVar, ';',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        rule.silent ? '' : [lastMatchedReaderVar, '=', ruleVar, ';'],
        rule.nextStage === undefined ? '' : [
          stageIndexVar, '=',
          typeof rule.nextStage === 'function'
              ? [stagesVar, '.indexOf(', ruleVar, '.nextStage(', chunkVar, ',', nextOffsetVar, ',', readerResultVar, '-', nextOffsetVar, ',', contextVar, '))']
              : stages.indexOf(rule.nextStage),
          ';'
        ],
        nextOffsetVar, '=', readerResultVar, ';',

        // Restart the looping over characters in the input chunk
        'continue}',
      ]);

    }

    return code;
  };

  const code: Code = [
    'var ',
    stageIndexVar, '=', stateVar, '.stageIndex,',
    chunkVar, '=', stateVar, '.chunk,',
    offsetVar, '=', stateVar, '.offset,',
    chunkOffsetVar, '=', stateVar, '.chunkOffset,',

    tokenCallbackVar, '=', handlerVar, '.token,',
    errorCallbackVar, '=', handlerVar, '.error,',
    unrecognizedTokenCallbackVar, '=', handlerVar, '.unrecognizedToken,',

    lastMatchedReaderVar, '=null,',
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length;',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    stagePlans.length ? [
      'switch(', stageIndexVar, '){',
      stagePlans.map((plans, stageIndex) => ['case ', stageIndex, ':', createRulePlansCode(plans, nextOffsetVar), 'break;']),
      defaultPlans.length ? ['default:', createRulePlansCode(defaultPlans, nextOffsetVar)] : '',
      '}',
    ] : createRulePlansCode(defaultPlans, nextOffsetVar),

    'break}',

    'if(', streamingVar, ')return;',

    // Emit trailing unconfirmed token
    'if(', lastMatchedReaderVar, '!==null){',
    tokenCallbackVar, '(', lastMatchedReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ');',
    stateVar, '.stageIndex=', stageIndexVar, ';',
    stateVar, '.offset=', nextOffsetVar, ';',
    '}',

    // Trigger unrecognized token
    'if(', nextOffsetVar, '!==', chunkLengthVar, ')',
    unrecognizedTokenCallbackVar, '(', chunkOffsetVar, '+', nextOffsetVar, ');',
  ];

  const ruleIterator = compileFunction<RuleIterator<S, C>>([stateVar, streamingVar, handlerVar, contextVar], code, bindings);

  ruleIterator.stages = stages;

  return ruleIterator;
}
