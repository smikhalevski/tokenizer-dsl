import {Taker} from '../types';

/**
 * Creates taker that takes chars using `takers` executing them one after another as a sequence.
 */
export function seq(...takers: Array<Taker>): Taker {
  const takerCount = takers.length;

  return (input, offset) => {
    for (let i = 0; i < takerCount && offset >= 0; ++i) {
      offset = takers[i](input, offset);
    }
    return offset;
  };
}
