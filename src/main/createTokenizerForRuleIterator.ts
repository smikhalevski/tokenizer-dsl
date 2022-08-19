import { RuleIterator, TokenizerState } from './rules';
import { Tokenizer } from './tokenizer-types';

/**
 * Creates a tokenizer that uses the given rule iterator to read tokens from the input.
 *
 * @param ruleIterator The rule iterator to use.
 * @param initialStage The initial stage at which the tokenizer should start.
 * @returns The tokenizer instance.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Stage The type of stages at which rules are applied.
 * @template Context The context that rules may consume.
 */
export function createTokenizerForRuleIterator<Type, Stage, Context = void>(ruleIterator: RuleIterator<Type, Stage, Context>, initialStage?: Stage): Tokenizer<Type, Stage, Context> {

  const tokenizer: Tokenizer<Type, Stage, Context> = (input, handler, context) => {
    const state: TokenizerState<Stage> = typeof input === 'string' ? {
      stage: initialStage!,
      chunk: input,
      chunkOffset: 0,
      offset: 0
    } : input;

    ruleIterator(state, handler, context, false);

    return state;
  };

  tokenizer.write = (chunk, state, handler, context) => {
    if (state) {
      state.chunk = state.chunk.slice(state.offset) + chunk;
      state.chunkOffset += state.offset;
      state.offset = 0;
    } else {
      state = { stage: initialStage!, chunk, chunkOffset: 0, offset: 0 };
    }

    ruleIterator(state, handler, context, true);

    return state;
  };

  return tokenizer;
}
