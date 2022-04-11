import {Taker, toTakerFunction} from '../takers';
import {Rule, StageProvider} from './rule-types';

/**
 * Creates the new rule that reads tokens.
 *
 * @param taker The taker that would read chars from the input.
 * @param stages The list of stages at which rule can be used. If omitted then rule is used on all stages. If an empty
 * array then rule is never used.
 * @param nextStage Provides the stage to which tokenizer transitions if this rule successfully reads a token. If
 * `undefined` the next stage is set to the current stage.
 * @returns The tokenization rule definition.
 */
export function createRule<S = any, C = any>(taker: Taker<C>, stages?: S[], nextStage?: StageProvider<S, C> | S): Rule<S, C> {
  return {
    taker: toTakerFunction(taker),
    stages,
    nextStage,
  };
}
