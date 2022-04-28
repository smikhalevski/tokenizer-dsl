import {compileRuleIterator, createRuleTree, Rule, TokenHandler, TokenizerState} from './rules';

export interface Tokenizer<Type = unknown, Stage = void, Context = void> {

  (chunk: string, handler: TokenHandler<Type, Context>, context: Context): Readonly<TokenizerState<Stage>>;

  write(chunk: string, handler: TokenHandler<Type, Context>, state: Readonly<TokenizerState<Stage>> | void, context: Context): Readonly<TokenizerState<Stage>>;

  end(handler: TokenHandler<Type, Context>, state: Readonly<TokenizerState<Stage>>, context: Context): Readonly<TokenizerState<Stage>>;
}

/**
 * Creates a new pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Context The context that rules may consume.
 */
export function createTokenizer<Type, Context = void>(rules: Rule<Type, void, Context>[]): Tokenizer<Type, void, Context>;

/**
 * Creates a new pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 * @param initialStage The initial state from which tokenization starts.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Stage The type of stages at which rules are applied.
 * @template Context The context that rules may consume.
 */
export function createTokenizer<Type, Stage, Context = void>(rules: Rule<Type, Stage, Context>[], initialStage: Stage): Tokenizer<Type, Stage, Context>;

export function createTokenizer(rules: Rule[], initialStage?: any) {
  const ruleIterator = compileRuleIterator(createRuleTree(rules));

  const tokenizer: Tokenizer = (chunk, handler, context) => {
    const state = createState(initialStage, chunk, 0, 0);
    ruleIterator(state, handler, context, false);
    return state;
  };

  tokenizer.write = (chunk, handler, state, context) => {
    if (state) {
      state = createState(state.stage, state.chunk.slice(state.offset) + chunk, 0, state.chunkOffset + state.offset);
    } else {
      state = createState(initialStage, chunk, 0, 0);
    }
    ruleIterator(state, handler, context, true);
    return state;
  };

  tokenizer.end = (handler, state, context) => {
    state = createState(state.stage, state.chunk, state.offset, state.chunkOffset);
    ruleIterator(state, handler, context, false);
    return state;
  };

  return tokenizer;
}

function createState<Stage>(stage: Stage, chunk: string, offset: number, chunkOffset: number): TokenizerState<Stage> {
  return {stage, chunk, offset, chunkOffset};
}
