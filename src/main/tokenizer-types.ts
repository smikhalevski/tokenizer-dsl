import { TokenHandler, TokenizerState } from './rules';

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
  (
    input: string | TokenizerState<Stage>,
    handler: TokenHandler<Type, Stage, Context>,
    context: Context
  ): TokenizerState<Stage>;

  /**
   * Reads tokens from the chunk in a streaming fashion. During streaming, {@linkcode TokenHandler} is triggered only with
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
   * @param state The mutable state returned by the previous {@linkcode Tokenizer.write} call.
   * @param context The context that should be passed to readers and stage providers.
   * @returns The result state of the tokenizer.
   */
  write(
    chunk: string,
    state: TokenizerState<Stage> | undefined,
    handler: TokenHandler<Type, Stage, Context>,
    context: Context
  ): TokenizerState<Stage>;
}
