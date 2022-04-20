import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {createReaderCallCode, NO_MATCH, seq} from '../readers';
import {createRuleIterationPlan, RulePlan} from './createRuleIterationPlan';
import {Rule, RuleHandler} from './rule-types';

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
 *
 * @param rules The list of tokes that iterator can process.
 */
export function compileRuleIterator<S, C>(rules: Rule<S, C>[]): RuleIterator<S, C> {

  const iterationPlan = createRuleIterationPlan(rules);
  const bindings: Binding[] = [];

  const stagesVar = createVar();

  if (iterationPlan.stagesComputed) {
    bindings.push([stagesVar, iterationPlan.stages]);
  }

  const stateVar = createVar();
  const streamingVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();

  const tokenCallbackVar = createVar();
  const errorCallbackVar = createVar();
  const unrecognizedTokenCallbackVar = createVar();

  const stageIndexVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();
  const chunkOffsetVar = createVar();

  const prevReaderVar = createVar();
  const prefixOffsetVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();

  const createRulePlansCode = (plans: RulePlan<S, C>[], prevPrefixOffsetVar: Var): Code => {

    const readerResultVar = createVar();

    const code: Code[] = [
      'var ', readerResultVar, ';',
    ];

    for (const plan of plans) {

      // Check the prefix
      code.push(
          prefixOffsetVar, '=', prevPrefixOffsetVar, ';',
          createReaderCallCode(seq(...plan.prefix), chunkVar, prefixOffsetVar, contextVar, readerResultVar, bindings),
          'if(', readerResultVar, '!==', NO_MATCH, '&&', readerResultVar, '!==', prefixOffsetVar, '){',
      );

      // Apply nested plans
      if (plan.children) {
        code.push(createRulePlansCode(plan.children, readerResultVar));
      }

      // Apply plan rule
      if (plan.rule) {

        const ruleVar = createVar();

        bindings.push([ruleVar, plan.rule]);

        code.push([

          // Emit error
          'if(', readerResultVar, '<0){',
          errorCallbackVar, '(', ruleVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', readerResultVar, ');',
          'return}',

          // Emit confirmed token
          'if(', prevReaderVar, '){',
          tokenCallbackVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ');',
          prevReaderVar, '=undefined;',
          '}',

          stateVar, '.stageIndex=', stageIndexVar, ';',
          stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

          plan.rule.nextStage === undefined ? '' :
              typeof plan.rule.nextStage === 'function'
                  ? [stageIndexVar, '=', stagesVar, '.indexOf(', ruleVar, '.nextStage(', chunkVar, ',', nextOffsetVar, ',', readerResultVar, '-', nextOffsetVar, ',', contextVar, '));']
                  : [stageIndexVar, '=', iterationPlan.stages.indexOf(plan.rule.nextStage), ';']
          ,

          plan.rule.silent ? '' : [prevReaderVar, '=', ruleVar, ';'],
          nextOffsetVar, '=', readerResultVar, ';',

          // Continue the looping over characters in the input chunk
          'continue',
        ]);
      }

      code.push('}');
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

    prevReaderVar, ',',
    prefixOffsetVar, ',',
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length;',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    iterationPlan.stagePlans.length ? [
      'switch(', stageIndexVar, '){',
      iterationPlan.stagePlans.map((plans, i) => [
        'case ', i, ':',
        createRulePlansCode(plans, nextOffsetVar),
        'break;',
      ]),
      iterationPlan.defaultPlans.length ? ['default:', createRulePlansCode(iterationPlan.defaultPlans, nextOffsetVar)] : '',
      '}',
    ] : createRulePlansCode(iterationPlan.defaultPlans, nextOffsetVar),

    'break}',

    'if(', streamingVar, ')return;',

    // Emit trailing unconfirmed token
    'if(', prevReaderVar, '){',
    tokenCallbackVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', nextOffsetVar, '-', offsetVar, ');',
    stateVar, '.stageIndex=', stageIndexVar, ';',
    stateVar, '.offset=', nextOffsetVar, ';',
    '}',

    // Trigger unrecognized token
    'if(', nextOffsetVar, '!==', chunkLengthVar, ')',
    unrecognizedTokenCallbackVar, '(', chunkOffsetVar, '+', nextOffsetVar, ');',
  ];

  const ruleIterator = compileFunction<RuleIterator<S, C>>([stateVar, streamingVar, handlerVar, contextVar], code, bindings);

  ruleIterator.stages = iterationPlan.stages;

  return ruleIterator;
}
