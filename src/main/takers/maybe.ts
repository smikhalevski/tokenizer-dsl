import {Taker, ResultCode, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: TakerLike): Taker {
  return new MaybeTaker(toTaker(taker));
}

export class MaybeTaker implements Taker {

  private readonly __taker;

  public constructor(taker: Taker) {
    this.__taker = taker;
  }

  public take(input: string, offset: number): number {
    const result = this.__taker.take(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  }
}
