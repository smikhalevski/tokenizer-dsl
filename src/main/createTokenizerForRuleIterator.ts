import { RuleIterator, TokenizerState } from './rules';
import { Tokenizer } from './tokenizer-types';

export function createTokenizerForRuleIterator<Type, Stage, Context>(ruleIterator: RuleIterator<Type, Stage, Context>, initialStage?: Stage): Tokenizer<Type, Stage, Context>;

export function createTokenizerForRuleIterator(ruleIterator: RuleIterator, initialStage?: any): Tokenizer {

  const tokenizer: Tokenizer = (input, handler, context) => {
    const state: TokenizerState = typeof input === 'string' ? {
      stage: initialStage,
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
      state = { stage: initialStage, chunk, chunkOffset: 0, offset: 0 };
    }

    ruleIterator(state, handler, context, true);

    return state;
  };

  return tokenizer;
}
