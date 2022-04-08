import {Code, compileFunction, createVar, Var} from '../code';
import {isTakerCodegen, NO_MATCH} from '../takers';
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
  uniqueStages: readonly S[];
}

/**
 * Compiles tokens into a token iterator function.
 *
 * @param rules The list of tokes that iterator can process.
 */
export function compileRuleIterator<S, C>(rules: Rule<S, C>[]): RuleIterator<S, C> {

  const uniqueStages: S[] = [];

  for (const rule of rules) {
    if (rule.stages) {
      for (const stage of rule.stages) {
        if (uniqueStages.indexOf(stage) === -1) {
          uniqueStages.push(stage);
        }
      }
    }
  }

  const stateVar = createVar();
  const streamingVar = createVar();
  const handlerVar = createVar();

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

  const bindings: [Var, unknown][] = [];

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

    rules.map((rule) => {

      const {taker, stages} = rule;

      if (stages?.length === 0) {
        return '';
      }

      const ruleVar = createVar();
      const takerVar = createVar();

      bindings.push([ruleVar, rule]);

      if (isTakerCodegen(taker)) {
        if (taker.bindings) {
          bindings.push(...taker.bindings);
        }
      } else {
        bindings.push([takerVar, taker]);
      }

      return [
        // Check if token can be applied on the current stage
        stages ? ['if(', stages.map((stage, i) => [i === 0 ? '' : '||', stageIndexVar, '===', uniqueStages.indexOf(stage)]), '){'] : '',

        // Take chars from the input string
        isTakerCodegen(taker) ? taker.factory(chunkVar, nextOffsetVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', chunkVar, ',', nextOffsetVar, ');'],

        'if(', takerResultVar, '!==', NO_MATCH, '&&', takerResultVar, '!==', nextOffsetVar, '){',

        // Emit error
        'if(', takerResultVar, '<0){',
        errorCallbackVar, '(', ruleVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', takerResultVar, ');',
        'return}',

        // Emit confirmed token
        'if(', prevReaderVar, '){',
        tokenCallbackVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',
        prevReaderVar, '=undefined;',
        '}',

        stateVar, '.stageIndex=', stageIndexVar, ';',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        rule.nextStage === undefined ? '' : [stageIndexVar, '=', uniqueStages.indexOf(rule.nextStage as S), ';'],
        prevReaderVar, '=', ruleVar, ';',
        nextOffsetVar, '=', takerResultVar, ';',

        'continue}',

        stages ? '}' : '',
      ];
    }),
    'break}',

    'if(', streamingVar, ')return;',

    // Emit trailing unconfirmed token
    'if(', prevReaderVar, '){',
    tokenCallbackVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',
    stateVar, '.stageIndex=', stageIndexVar, ';',
    stateVar, '.offset=', nextOffsetVar, ';',
    '}',

    // Trigger unrecognized token
    'if(', nextOffsetVar, '!==', chunkLengthVar, ')',
    unrecognizedTokenCallbackVar, '(', chunkOffsetVar, '+', nextOffsetVar, ');',
  ];

  const ruleIterator = compileFunction<RuleIterator<S, C>>([stateVar, streamingVar, handlerVar], code, bindings);

  ruleIterator.uniqueStages = uniqueStages;

  return ruleIterator;
}
