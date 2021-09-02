import {CharCodeChecker, ResultCode, Taker, TakerType} from '../taker-types';
import {withType} from '../taker-utils';

export interface IUntilOptions {

  /**
   * If set to `true` then chars matched by `taker` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;
}

/**
 * Creates taker that takes chars until `taker` matches.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function until(taker: Taker, options: IUntilOptions = {}): Taker {
  const {inclusive = false} = options;

  if (taker.type === TakerType.TEXT_CASE_SENSITIVE) {

    const str = taker.data;
    const takenOffset = inclusive ? str.length : 0;

    return withType(TakerType.UNTIL_TEXT_CASE_SENSITIVE, str, (input, offset) => {
      const index = input.indexOf(str, offset);

      return index === -1 ? ResultCode.NO_MATCH : index + takenOffset;
    });
  }

  if (taker.type === TakerType.CHAR) {
    const charCodeChecker: CharCodeChecker = taker.data;
    const takenOffset = inclusive ? 1 : 0;

    return withType(TakerType.UNTIL_CHAR, charCodeChecker, (input, offset) => {
      const inputLength = input.length;

      let i = offset;
      while (i < inputLength && !charCodeChecker(input.charCodeAt(i))) {
        ++i;
      }
      if (i === inputLength) {
        return ResultCode.NO_MATCH;
      }
      return i + takenOffset;
    });
  }

  return withType(TakerType.UNTIL, taker, (input, offset) => {
    let result;
    let i = offset;

    do {
      result = taker(input, i);
      ++i;
    } while (result === ResultCode.NO_MATCH);

    if (result < 0) {
      return result;
    }
    return inclusive ? result : i - 1;
  });
}
