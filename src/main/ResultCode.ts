export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,

  /**
   * This is an error return code that means that a generic error occurred during parsing. Further parsing should be
   * aborted if this code is returned.
   */
  ERROR = -2,
}
