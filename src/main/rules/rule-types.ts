import {Taker} from '../takers';

/**
 * Defines how token is read from the input string.
 */
export interface Rule<Stage> {

  /**
   * The taker that takes chars from the string.
   */
  taker: Taker;

  /**
   * The list of stages at which token can be used. If omitted then token is used on all stages. If an empty array
   * then token is never used.
   *
   * @default undefined
   */
  stages: Stage[] | undefined;

  /**
   * The stage which should be used for next token if this token has successfully read the token.
   *
   * If `undefined` the next stage is set to the current stage.
   *
   * @default undefined
   */
  nextStage: Stage | undefined;
}

export interface RuleHandler<Stage> {

  /**
   * Triggered when a token was read from the input stream.
   *
   * @param rule The token that was read.
   * @param startOffset The absolute offset from the start of the input stream where the token starts.
   * @param endOffset The absolute offset from the start of the input stream where the token ends.
   */
  token(rule: Rule<Stage>, startOffset: number, endOffset: number): void;

  /**
   * Triggered when a taker returned an error code (a negative number, usually an integer <= -2).
   *
   * @param rule The token that returned an error.
   * @param offset The offset from which the token was read.
   * @param errorCode The error code.
   */
  error(rule: Rule<Stage>, offset: number, errorCode: number): void;

  /**
   * Triggered if the tokenizer failed to read detect the token in the input stream at the given offset.
   *
   * @param offset The offset at which the unrecognized token starts.
   */
  unrecognizedToken(offset: number): void;
}
