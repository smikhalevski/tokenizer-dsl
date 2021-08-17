import {Taker} from '../types';
import {ResultCode} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  return (input, offset) => {
    const result = taker(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  };
}
