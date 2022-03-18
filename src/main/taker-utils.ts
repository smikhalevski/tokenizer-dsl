import {Taker, ResultCode, TakerLike} from './taker-types';

/**
 * Taker that always returns `NO_MATCH`.
 */
export const noneTaker: Taker = {
  take: () => ResultCode.NO_MATCH,
};

/**
 * Taker that returns the current offset.
 */
export const neverTaker: Taker = {
  take: (input, offset) => offset,
};

/**
 * Converts string to an array of char codes.
 *
 * @param str The string to read chars from.
 * @returns An array of char codes.
 */
export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

/**
 * Converts a function to a {@link Taker} instance.
 *
 * @param taker The function or a {@link Taker} instance.
 */
export function toTaker(taker: TakerLike): Taker {
  return typeof taker === 'function' ? {take: taker} : taker;
}
