import {ResultCode, Taker, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';
import {none} from './none';
import {never} from './never';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: TakerLike[]): Taker {

  const t = takers.reduce<Taker[]>((t, taker) => {
    if (t.length !== 0 && t[t.length - 1] === none) {
      return t;
    }
    if (taker instanceof OrTaker) {
      t.push(...taker.__takers);
      return t;
    }
    if (taker !== never) {
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

  return new OrTaker(t);
}

export class OrTaker implements Taker {

  public readonly __takers;

  public constructor(takers: Taker[]) {
    this.__takers = takers;
  }

  public take(input: string, offset: number): number {
    const {__takers} = this;
    const takerCount = __takers.length;

    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = __takers[i].take(input, offset);
    }
    return result;
  }
}
