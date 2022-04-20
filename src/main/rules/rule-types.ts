import {Reader} from '../readers';

export type StageProvider<S, C> = (input: string, offset: number, length: number, context: C) => S;

/**
 * Defines how token is read from the input string.
 *
 * @template S The tokenizer stage type.
 * @template C The context passed by tokenizer.
 */
export interface Rule<S, C> {

  /**
   * The reader that reads chars from the string.
   */
  reader: Reader<C>;

  /**
   * The list of stages at which rule can be used. If omitted then rule is used on all stages. If an empty array
   * then rule is never used.
   *
   * @default undefined
   */
  stages?: S[] | undefined;

  /**
   * Provides the stage to which tokenizer transitions if this rule successfully reads a token.
   *
   * If `undefined` the next stage is set to the current stage.
   *
   * @default undefined
   */
  nextStage?: StageProvider<S, C> | S | undefined;

  /**
   * If set to `true` then tokens read by this reader are not emitted.
   */
  silent?: boolean;

  /**
   * If set to `true` and multiple sequential tokens are read from the input by this reader, then they are emitted as a
   * single token.
   */
  continuous?: boolean;
}

/**
 * Handles tokens read from the input stream.
 *
 * @template S The tokenizer stage type.
 * @template C The context passed by tokenizer.
 */
export interface RuleHandler<S, C> {

  /**
   * Triggered when a token was read from the input stream.
   *
   * @param rule The rule that read the token.
   * @param offset The absolute offset from the start of the input stream where the token starts.
   * @param length The number of chars read by the rule.
   */
  token(rule: Rule<S, C>, offset: number, length: number): void;

  /**
   * Triggered when the rule returned an error code.
   *
   * @param rule The rule that returned an error.
   * @param offset The offset at which the rule was used.
   * @param errorCode The error code. A negative integer <= -2.
   */
  error(rule: Rule<S, C>, offset: number, errorCode: number): void;

  /**
   * Triggered if there was no rule that could successfully read a token at the offset.
   *
   * @param offset The offset at which the unrecognized token starts.
   */
  unrecognizedToken(offset: number): void;
}
