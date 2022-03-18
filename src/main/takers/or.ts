import {Taker, ResultCode, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';
import {none} from './none';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: TakerLike[]): Taker {
  const takerCount = takers.length;

  if (takerCount === 0) {
    return none;
  }
  if (takerCount === 1) {
    return toTaker(takers[0]);
  }

  return new OrTaker(takers.map(toTaker));
}

export class OrTaker implements Taker {

  private readonly __takers;

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
