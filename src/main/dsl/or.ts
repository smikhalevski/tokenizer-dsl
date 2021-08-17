import {Taker} from '../types';
import {ResultCode, takeNone} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Array<Taker>): Taker {
  const takerCount = takers.length;

  if (takerCount === 0) {
    return takeNone;
  }

  if (takerCount === 1) {
    return takers[0];
  }

  return (input, offset) => {
    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = takers[i](input, offset);
    }
    return result;
  };
}
