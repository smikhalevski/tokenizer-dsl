export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,
}

export const enum TakerType {
  UNTIL,
  UNTIL_TEXT_CASE_SENSITIVE,
  UNTIL_CHAR,
  ALL,
  ALL_CHAR,
  END,
  MAYBE,
  SEQ,
  OR,
  TEXT_CASE_SENSITIVE,
  TEXT_CASE_INSENSITIVE,
  CHAR,
  REGEX,
  NONE,
  NEVER,
}

/**
 * Takes the string `input` and the offset in thi¬s string `offset` and returns the new offset in `input` if taker
 * matched or a result code if taker didn't match. The taker may return offsets that exceed the `input` length.
 */
export interface Taker {
  (input: string, offset: number): number;

  /**
   * The type that distinguishes takers so we can pick be best optimization strategy.
   */
  type?: TakerType;

  /**
   * Additional data associated with taker that can be used during optimization.
   */
  data?: any;
}

export type CharCodeChecker = (charCode: number) => boolean;
