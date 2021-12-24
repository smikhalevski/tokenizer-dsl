import {ITaker, ResultCode, TakerLike} from '../taker-types';
import {noneTaker, toTaker} from '../taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Array<TakerLike>): ITaker {
  const takerCount = takers.length;

  if (takerCount === 0) {
    return noneTaker;
  }
  if (takerCount === 1) {
    return toTaker(takers[0]);
  }

  return new OrTaker(takers.map(toTaker));
}

export class OrTaker implements ITaker {

  private _takers;

  public constructor(takers: Array<ITaker>) {
    this._takers = takers;
  }

  public take(input: string, offset: number): number {
    const takers = this._takers;
    const takerCount = takers.length;

    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = takers[i].take(input, offset);
    }
    return result;
  }
}
