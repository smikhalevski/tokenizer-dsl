/**
 * This is an OK return code that means that taker didn't match any chars.
 */
export const NO_MATCH = -1;

/**
 * Takes the string `input` and the offset in thi¬s string `offset` and returns the new offset in `input` if taker
 * matched or a result code if taker didn't match. The taker may return offsets that exceed the `input` length.
 */
export type Taker = (input: string, offset: number) => number;

export type CharCodeChecker = (charCode: number) => boolean;
