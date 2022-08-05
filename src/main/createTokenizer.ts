import { compileRuleIterator, createRuleTree, Rule, TokenHandler, TokenizerState } from './rules';

/**
 * The pure tokenization function compiled from a set of rules.
 *
 * @template Type The type of the token emitted by the tokenizer.
 * @template Stage The tokenizer stage type.
 * @template Context The context passed to the tokenizer.
 */
export interface Tokenizer<Type = unknown, Stage = void, Context = void> {

  /**
   * Reads tokens from the input in a non-streaming fashion.
   *
   * @param input The input string to tokenize or a tokenizer state to process.
   * @param handler The callbacks that are invoked when tokens are read from the string.
   * @param context The context that should be passed to readers and stage providers.
   * @returns The result state of the tokenizer.
   */
  (input: string | TokenizerState<Stage>, handler: TokenHandler<Type, Stage, Context>, context: Context): TokenizerState<Stage>;

  /**
   * Reads tokens from the chunk in a streaming fashion. During streaming, {@link TokenHandler} is triggered only with
   * confirmed tokens. Token is confirmed if the consequent token was successfully read.
   *
   * ```ts
   * let state = tokenizer.write('foo', undefined, handler);
   * tokenizer.write('bar', state, handler);
   * tokenizer(state, handler);
   * ```
   *
   * @param chunk The input chunk to tokenize.
   * @param handler The callbacks that are invoked when tokens are read from the string.
   * @param state The mutable state returned by the previous {@link Tokenizer.write} call.
   * @param context The context that should be passed to readers and stage providers.
   * @returns The result state of the tokenizer.
   */
  write(chunk: string, state: TokenizerState<Stage> | undefined, handler: TokenHandler<Type, Stage, Context>, context: Context): TokenizerState<Stage>;
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
