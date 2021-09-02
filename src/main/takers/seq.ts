import {Taker, TakerType} from '../taker-types';
import {takeNone, withType} from '../taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Array<Taker>): Taker {
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

    return withType(TakerType.SEQ, takers, (input, offset) => {
      const result = taker0(input, offset);

      return result >= 0 ? taker1(input, result) : result;
    });
  }

  return withType(TakerType.SEQ, takers, (input, offset) => {
    for (let i = 0; i < takerCount && offset >= 0; ++i) {
      offset = takers[i](input, offset);
    }
    return offset;
  });
}
