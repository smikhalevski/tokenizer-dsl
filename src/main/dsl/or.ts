import {Taker} from '../types';
import {ResultCode} from '../ResultCode';

/**
 * Creates taker that returns the result of the first taker that matched.
 */
export function or(...takers: Array<Taker>): Taker {
  const takerCount = takers.length;

  return (input, offset) => {
    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = takers[i](input, offset);
    }
    return result;
  };
}
