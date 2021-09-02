import {ResultCode, Taker, TakerType} from '../taker-types';
import {withType} from '../taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  return withType(TakerType.MAYBE, taker, (input, offset) => {
    const result = taker(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  });
}
