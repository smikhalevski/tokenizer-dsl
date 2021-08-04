import {CharCodeChecker, Taker} from '../types';
import {ResultCode} from '../ResultCode';
import {charBy} from './char';

export interface IAllOptions {

  /**
   * The minimum number of matches to consider success.
   *
   * @default 0
   */
  minimumCount?: number;

  /**
   * The maximum number of matches to read.
   *
   * @default -1
   */
  maximumCount?: number;
}

/**
 * Creates taker that repeatedly takes chars that `taker` takes.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function all(taker: Taker, options: IAllOptions = {}): Taker {
  const {minimumCount = 0, maximumCount = -1} = options;

  if (taker.__factory?.[0] === charBy) {
    return allCharBy(taker.__factory[1], options);
  }

  return (input, offset) => {
    const charCount = input.length;

    let count = 0;

    while (offset < charCount && (maximumCount < 0 || count < maximumCount)) {
      const result = taker(input, offset);

      if (result === ResultCode.NO_MATCH || result === offset) {
        break;
      }
      if (result < ResultCode.NO_MATCH) {
        return result;
      }
      offset = result;
      ++count;
    }
    if (count < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return offset;
  };
}

/**
 * Performance optimization for `all(charBy(…))` composition.
 *
 * @param charCodeChecker The checker that tests the chars from the string.
 * @param options Taker options.
 */
export function allCharBy(charCodeChecker: CharCodeChecker, options: IAllOptions = {}): Taker {
  const {minimumCount = 0, maximumCount = -1} = options;

  return (input, offset) => {
    const charCount = maximumCount < 0 ? input.length : Math.min(input.length, offset + maximumCount);

    let i = offset;
    while (i < charCount && charCodeChecker(input.charCodeAt(i))) {
      ++i;
    }
    if (i - offset < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  };
}
