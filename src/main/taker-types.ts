export type CharCodeChecker = (charCode: number) => boolean;

export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,
}

export const enum TakerType {
  ALL_CHAR,
  ALL_CASE_SENSITIVE_TEXT,
  ALL_REGEX,
  ALL_GENERIC,
  CHAR,
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
  UNTIL_CHAR,
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
