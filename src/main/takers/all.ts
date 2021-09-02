import {CharCodeChecker, ResultCode, Taker, TakerType} from '../taker-types';
import {takeNever, takeNone, withType} from '../taker-utils';

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
   * @default Infinity
   */
  maximumCount?: number;
}

/**
 * Creates taker that repeatedly takes chars using `taker`.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function all(taker: Taker, options: IAllOptions = {}): Taker {
  const {minimumCount = 0, maximumCount = Infinity} = options;

  if (minimumCount > maximumCount || maximumCount < 0) {
    return takeNever;
  }
  if (maximumCount === 0) {
    return takeNone;
  }
  if (maximumCount === 1) {
    return taker;
  }

  if (taker.type === TakerType.CHAR) {
    const charCodeChecker: CharCodeChecker = taker.data;

    return withType(TakerType.ALL_CHAR, charCodeChecker, (input, offset) => {
      const maximumOffset = offset + maximumCount;

      let i = offset;
      while (i < maximumOffset && charCodeChecker(input.charCodeAt(i))) {
        ++i;
      }
      if (i - offset < minimumCount) {
        return ResultCode.NO_MATCH;
      }
      return i;
    });
  }

  return withType(TakerType.ALL, taker, (input, offset) => {
    let takeCount = 0;
    let result = offset;
    let i;

    do {
      i = result;
      result = taker(input, i);
    } while (result > i && ++takeCount < maximumCount);

    if (takeCount < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    if (result === ResultCode.NO_MATCH) {
      return i;
    }
    return result;
  });
}
