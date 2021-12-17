import {ResultCode, Taker, TakerType} from '../taker-types';
import {takeNone, withType} from '../taker-utils';

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

  if (takerCount === 2) {
    const taker0 = takers[0];
    const taker1 = takers[1];

    return withType(TakerType.OR, takers, (input, offset) => {
      const result = taker0(input, offset);

      return result === ResultCode.NO_MATCH ? taker1(input, offset) : result;
    });
  }

  return withType(TakerType.OR, takers, (input, offset) => {
    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = takers[i](input, offset);
    }
    return result;
  });
}