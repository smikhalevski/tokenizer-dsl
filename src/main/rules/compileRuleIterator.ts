import {Binding, Code, compileFunction, createVar} from '../code';
import {createTakerCallCode, NO_MATCH, seq} from '../takers';
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
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();
  const takerResultVar = createVar();

  const createRulePlansCode = (plans: RulePlan<S, C>[]): Code => {

    const code: Code[] = [];

    for (const plan of plans) {

      // Check the prefix
      code.push(createTakerCallCode(seq(...plan.prefix), chunkVar, nextOffsetVar, contextVar, takerResultVar, bindings));

      // Apply nested plans
      if (plan.children) {
        code.push(createRulePlansCode(plan.children));
      }

      if (plan.rule) {

        const ruleVar = createVar();

        bindings.push([ruleVar, plan.rule]);

        code.push([
          'if(', takerResultVar, '!==', NO_MATCH, '&&', takerResultVar, '!==', nextOffsetVar, '){',

          // Emit error
          'if(', takerResultVar, '<0){',
          errorCallbackVar, '(', ruleVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', takerResultVar, ');',
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
                  ? [stageIndexVar, '=', stagesVar, '.indexOf(', ruleVar, '.nextStage(', chunkVar, ',', nextOffsetVar, ',', takerResultVar, '-', nextOffsetVar, ',', contextVar, '));']
                  : [stageIndexVar, '=', iterationPlan.stages.indexOf(plan.rule.nextStage), ';']
          ,

          prevReaderVar, '=', ruleVar, ';',
          nextOffsetVar, '=', takerResultVar, ';',

          'continue}',
        ]);
      }
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
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length,',
    takerResultVar, ';',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    iterationPlan.stagePlans.length ? [
      'switch(', stageIndexVar, '){',
      iterationPlan.stagePlans.map((plans, i) => [
        'case ', i, ':',
        createRulePlansCode(plans),
        'break;',
      ]),
      iterationPlan.defaultPlans.length ? ['default:', createRulePlansCode(iterationPlan.defaultPlans)] : '',
      '}',
    ] : createRulePlansCode(iterationPlan.defaultPlans),

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
