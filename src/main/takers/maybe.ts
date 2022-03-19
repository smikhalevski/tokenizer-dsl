import {Taker, ResultCode, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';
import {never} from './never';
import {none} from './none';
import {AllCaseSensitiveTextTaker, AllCharTaker, AllTaker} from './all';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: TakerLike): Taker {
  if (taker === never || taker === none || (taker instanceof AllCharTaker || taker instanceof AllCaseSensitiveTextTaker || taker instanceof AllTaker) && taker.__minimumCount === 0) {
    return taker;
  }
  return new MaybeTaker(toTaker(taker));
}

export class MaybeTaker implements Taker {

  public readonly __taker;

  public constructor(taker: Taker) {
    this.__taker = taker;
  }

  public take(input: string, offset: number): number {
    const result = this.__taker.take(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  }
}
