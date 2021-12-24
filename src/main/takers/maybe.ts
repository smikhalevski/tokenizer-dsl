import {ITaker, ResultCode, TakerLike} from '../taker-types';
import {toTaker} from '../taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: TakerLike): ITaker {
  return new MaybeTaker(toTaker(taker));
}

export class MaybeTaker implements ITaker {

  private _taker;

  public constructor(taker: ITaker) {
    this._taker = taker;
  }

  public take(input: string, offset: number): number {
    const result = this._taker.take(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  }
}
