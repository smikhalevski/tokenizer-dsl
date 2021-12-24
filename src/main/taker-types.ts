export type CharCodeChecker = (charCode: number) => boolean;

export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,
}

export interface ITaker {

  /**
   * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if taker
   * matched or a result code if taker didn't match. The taker may return offsets that exceed the `input` length.
   */
  take(input: string, offset: number): number;
}

export type TakerLike = ITaker | ITaker['take'];
