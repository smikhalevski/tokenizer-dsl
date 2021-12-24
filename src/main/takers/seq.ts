import {ITaker, TakerLike} from '../taker-types';
import {noneTaker, toTaker} from '../taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Array<TakerLike>): ITaker {
  const takerCount = takers.length;

  if (takerCount === 0) {
    return noneTaker;
  }
  if (takerCount === 1) {
    return toTaker(takers[0]);
  }

  return new SeqTaker(takers.map(toTaker));
}

export class SeqTaker implements ITaker {

  private _takers;

  public constructor(takers: Array<ITaker>) {
    this._takers = takers;
  }

  public take(input: string, offset: number): number {
    const takers = this._takers;
    const takerCount = takers.length;

    for (let i = 0; i < takerCount && offset >= 0; ++i) {
      offset = takers[i].take(input, offset);
    }
    return offset;
  }
}
