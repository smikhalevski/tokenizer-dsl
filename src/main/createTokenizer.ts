import {compileRuleIterator, createRuleTree, Rule, TokenHandler, TokenizerState} from './rules';

/**
 * The pure tokenization function compiled from a set of rules.
 *
 * @template Type The type of the token emitted by the tokenizer.
 * @template Stage The tokenizer stage type.
 * @template Context The context passed to the tokenizer.
 * @template Error The error that the reader may return.
 */
export interface Tokenizer<Type = unknown, Stage = void, Context = void, Error = number> {

  /**
   * Reads tokens from the input in a non-streaming fashion. Triggers a {@link TokenHandler.unrecognizedToken} if the
   * input wasn't read in full.
   *
   * @param input The input string to tokenize.
   * @param handler The callbacks that are invoked when tokens are read from the string, or when an error occurs.
   * @param context The context that should be passed to readers and stage providers.
   * @returns The result state of the tokenizer.
   */
  (input: string, handler: TokenHandler<Type, Context, Error>, context: Context): Readonly<TokenizerState<Stage>>;

  /**
   * Reads tokens from the chunk in a streaming fashion. Does not trigger a {@link TokenHandler.unrecognizedToken} is
   * input wasn't read in full. During streaming, {@link TokenHandler.token} is triggered only with confirmed tokens.
   * Token is confirmed if the consequent token was successfully read.
   *
   * ```ts
   * let state;
   * state = tokenizer.write('foo', handler);
   * state = tokenizer.write('bar', handler, state);
   * state = tokenizer.end(handler, state);
   * ```
   *
   * @param chunk The input chunk to tokenize.
   * @param handler The callbacks that are invoked when tokens are read from the string, or when an error occurs.
   * @param state The state returned by the previous {@link Tokenizer.write} call.
   * @param context The context that should be passed to readers and stage providers.
   * @returns The result state of the tokenizer.
   */
  write(chunk: string, handler: TokenHandler<Type, Context, Error>, state: Readonly<TokenizerState<Stage>> | void, context: Context): Readonly<TokenizerState<Stage>>;

  /**
   * Reads remaining tokens from the {@link TokenizerState.chunk}. Triggers a {@link TokenHandler.unrecognizedToken} if
   * the  {@link TokenizerState.chunk} wasn't read in full.
   *
   * @param handler The callbacks that are invoked when tokens are read from the string, or when an error occurs.
   * @param state The state returned by the previous {@link Tokenizer.write} call.
   * @param context The context that should be passed to readers and stage providers.
   * @returns The result state of the tokenizer.
   */
  end(handler: TokenHandler<Type, Context, Error>, state: Readonly<TokenizerState<Stage>>, context: Context): Readonly<TokenizerState<Stage>>;
}

/**
 * Creates a new pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Context The context that rules may consume.
 * @template Error The error that the reader may return.
 */
export function createTokenizer<Type, Context = void, Error = number>(rules: Rule<Type, void, Context, Error>[]): Tokenizer<Type, void, Context, Error>;

/**
 * Creates a new pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 * @param initialStage The initial state from which tokenization starts.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Stage The type of stages at which rules are applied.
 * @template Context The context that rules may consume.
 * @template Error The error that the reader may return.
 */
export function createTokenizer<Type, Stage, Context = void, Error = number>(rules: Rule<Type, Stage, Context, Error>[], initialStage: Stage): Tokenizer<Type, Stage, Context, Error>;

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
