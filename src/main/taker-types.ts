import {CodeChild, VarNode} from './js';

/**
 * The callback that must return `true` is given char code is appropriate, and must return `false` otherwise.
 */
export type CharCodeChecker = (charCode: number) => boolean;

export type CharCodeRange = number | number[];

export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,
}

/**
 * The type of the taker function, used for internal taker optimizations.
 *
 * @internal
 */
export const enum TakerType {
  ALL_CHAR_CODE_CHECKER,
  ALL_CHAR_CODE_RANGE,
  ALL_CASE_SENSITIVE_TEXT,
  ALL_REGEX,
  ALL_GENERIC,
  CHAR_CODE_CHECKER,
  CHAR_CODE_RANGE,
  END,
  MAYBE,
  OR,
  REGEX,
  SEQ,
  CASE_SENSITIVE_CHAR,
  CASE_INSENSITIVE_CHAR,
  CASE_SENSITIVE_TEXT,
  CASE_INSENSITIVE_TEXT,
  UNTIL_CASE_SENSITIVE_TEXT,
  UNTIL_CHAR_CODE_CHECKER,
  UNTIL_REGEX,
  UNTIL_GENERIC,
}

export interface Taker {

  /**
   * The type of the taker function, used for internal taker optimizations.
   *
   * @internal
   */
  __type?: TakerType;

  /**
   * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if taker
   * matched or a result code if taker didn't match. The taker may return offsets that exceed the `input` length.
   */
  (input: string, offset: number): number;
}

export type TakerCodeFactory = (inputVar: VarNode, offsetVar: VarNode, resultVar: VarNode) => CodeChild;

export interface InternalTaker extends Taker {
  __values: [VarNode, unknown][];
  __factory: TakerCodeFactory;
}
