import {Taker, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';
import {none} from './none';
import {never} from './never';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: TakerLike[]): Taker {
  if (takers.includes(never)) {
    return never;
  }

  const t = takers.reduce<Taker[]>((t, taker) => {
    if (taker instanceof SeqTaker) {
      t.push(...taker.__takers);
      return t;
    }
    if (taker !== none) {
      t.push(toTaker(taker));
    }
    return t;
  }, []);

  if (t.length === 0) {
    return none;
  }
  if (t.length === 1) {
    return t[0];
  }

  return new SeqTaker(t);
}

export class SeqTaker implements Taker {

  public readonly __takers;

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
