import {CharCodeChecker, Taker} from '../types';
import {ResultCode} from '../ResultCode';

export interface UntilOptions {

  /**
   * If set to `true` then termination char is included in match.
   *
   * @default false
   */
  inclusive?: boolean;

  /**
   * If set to `true` and termination char wasn't found then length of the string is returned, otherwise
   * {@link ResultCode.NO_MATCH} is returned.
   *
   * @default false
   */
  openEnded?: boolean;
}

export function until(value: string | CharCodeChecker, options: UntilOptions = {}): Taker {
  if (typeof value === 'string') {
    return untilText(value, options);
  } else {
    return untilCharBy(value, options);
  }
}

/**
 * Creates a taker that takes all chars until termination char is met.
 *
 * **Note:** If both `inclusive` and `openEnded` are set to `true` and the termination char wasn't found then
 * `str.length + 1` is returned.
 *
 * @param charCodeChecker The char checker that returns `true` for termination char code.
 * @param options Taker options.
 */
export function untilCharBy(charCodeChecker: CharCodeChecker, options: UntilOptions = {}): Taker {
  const {inclusive = false, openEnded = false} = options;

  return (input, offset) => {
    const charCount = input.length;

    while (offset < charCount) {
      if (charCodeChecker(input.charCodeAt(offset))) {
        return inclusive ? offset + 1 : offset;
      }
      ++offset;
    }
    return openEnded ? inclusive ? offset + 1 : offset : ResultCode.NO_MATCH;
  };
}

/**
 * Creates taker that takes all chars until termination text is met.
 *
 * **Note:** If both `inclusive` and `openEnded` are set to true and the termination text wasn't found then
 * `str.length + text.length` is returned.
 *
 * @param text The termination text.
 * @param options Taker options.
 */
export function untilText(text: string, options: UntilOptions = {}): Taker {
  const {inclusive = false, openEnded = false} = options;

  return (input, offset) => {
    let index = input.indexOf(text, offset);

    if (index === -1) {
      if (!openEnded) {
        return ResultCode.NO_MATCH;
      }
      index = input.length;
    }
    return inclusive ? index + text.length : index;
  };
}
