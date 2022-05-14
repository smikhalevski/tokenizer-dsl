import {Reader} from '../readers';

/**
 * Returns the stage to which the tokenizer should transition.
 *
 * @param chunk The input chunk from which the current token was read.
 * @param offset The chunk-relative offset where the current token was read.
 * @param length The number of chars read by the rule.
 * @param context The context passed by tokenizer.
 * @param state The current state of the tokenizer.
 * @returns The stage to which the tokenizer should transition.
 *
 * @template Stage The tokenizer stage type.
 * @template Context The context passed by tokenizer.
 */
export type StageProvider<Stage, Context> = (chunk: string, offset: number, length: number, context: Context, state: TokenizerState) => Stage;

/**
 * Defines how the token is read from the input string and how {@link Tokenizer} transitions between stages.
 *
 * @template Type The type of the token emitted by this rule.
 * @template Stage The tokenizer stage type.
 * @template Context The context passed by tokenizer.
 * @template Error The error that the reader may return.
 */
export interface Rule<Type = unknown, Stage = void, Context = void, Error = number> {

  /**
   * The reader that reads chars from the string.
   */
  reader: Reader<Context, Error>;

  /**
   * The type of the token that is passed to {@link TokenHandler.token} when the rule successfully reads chars from the
   * input string. Type isn't required to be unique, so multiple rules may share the same type if needed.
   *
   * @default undefined
   */
  type?: Type;

  /**
   * The list of stages at which the rule can be used. If `undefined` then the rule is used on all stages. If an empty
   * array then the rule is never used.
   *
   * @default undefined
   */
  on?: Stage[] | undefined;

  /**
   * Provides the stage to which tokenizer transitions if this rule successfully reads a token.
   *
   * If `undefined` then the stage is left unchanged.
   *
   * @default undefined
   */
  to?: StageProvider<Stage, Context> | Stage | undefined;

  /**
   * If set to `true` then tokens read by this reader are not emitted.
   *
   * @default false
   */
  silent?: boolean;
}

/**
 * The state that is used by the {@link Tokenizer} to track tokenization progress.
 *
 * @template Stage The tokenizer stage type.
 */
export interface TokenizerState<Stage = void> {

  /**
   * The current tokenizer stage.
   */
  readonly stage: Stage;

  /**
   * The chunk that is being processed.
   */
  readonly chunk: string;

  /**
   * The offset in the {@link chunk} from which the tokenization should proceed.
   */
  readonly offset: number;

  /**
   * The offset of the {@link chunk} in the input stream.
   */
  readonly chunkOffset: number;
}

/**
 * Handles tokens read from the input string.
 *
 * @template Type The type of tokens emitted by rules.
 * @template Context The context passed by tokenizer.
 * @template Error The error that the reader may return.
 */
export interface TokenHandler<Type = unknown, Context = void, Error = number> {

  /**
   * Triggered when a token was read from the input stream.
   *
   * The substring of the current token:
   *
   * ```ts
   * const tokenValue = chunk.substr(offset, length);
   * ```
   *
   * The offset of this token from the start of the input stream (useful if you're using {@link Tokenizer.write}):
   *
   * ```ts
   * const absoluteOffset = state.chunkOffset + offset;
   * ```
   *
   * @param type The type of the token that was read.
   * @param chunk The input chunk from which the token was read.
   * @param offset The chunk-relative offset from the start of the input stream where the token starts.
   * @param length The number of chars read by the rule.
   * @param context The context passed by the tokenizer.
   * @param state The current state of the tokenizer.
   */
  token(type: Type, chunk: string, offset: number, length: number, context: Context, state: TokenizerState): void;

  /**
   * Triggered when the rule returned an error code.
   *
   * @param type The type of the token that caused an error while reading.
   * @param chunk The input chunk from which the token was read.
   * @param offset The chunk-relative offset where the token starts.
   * @param error The error code (a negative number) or an error returned by the reader.
   * @param context The context passed by the tokenizer.
   * @param state The current state of the tokenizer.
   */
  error?(type: Type, chunk: string, offset: number, error: number | Error, context: Context, state: TokenizerState): void;

  /**
   * Triggered if there was no rule that could successfully read a token at the offset.
   *
   * @param chunk The input chunk from which tokens are read.
   * @param offset The chunk-relative offset where the unrecognized token starts.
   * @param context The context passed by the tokenizer.
   * @param state The current state of the tokenizer.
   */
  unrecognizedToken?(chunk: string, offset: number, context: Context, state: TokenizerState): void;
}
