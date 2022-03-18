import {Taker, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';
import {none} from './none';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: TakerLike[]): Taker {
  const takerCount = takers.length;

  if (takerCount === 0) {
    return none;
  }
  if (takerCount === 1) {
    return toTaker(takers[0]);
  }

  return new SeqTaker(takers.map(toTaker));
}

export class SeqTaker implements Taker {

  private readonly __takers;

  public constructor(takers: Taker[]) {
    this.__takers = takers;
  }

  public take(input: string, offset: number): number {
    const {__takers} = this;
    const takerCount = __takers.length;

    for (let i = 0; i < takerCount && offset >= 0; ++i) {
      offset = __takers[i].take(input, offset);
    }
    return offset;
  }
}
