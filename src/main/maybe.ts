import {isAllTaker} from './all';
import {never} from './never';
import {none} from './none';
import {ResultCode, Taker, TakerType} from './taker-types';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  if (taker === never || taker === none || isAllTaker(taker) && taker.__minimumCount === 0) {
    return taker;
  }
  return createMaybeTaker(taker);
}

export interface MaybeTaker extends Taker {
  __type: TakerType.MAYBE;
  __taker: Taker;
}

export function createMaybeTaker(taker: Taker): MaybeTaker {

  const take: MaybeTaker = (input, offset) => {
    const result = taker(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  };

  take.__type = TakerType.MAYBE;
  take.__taker = taker;

  return take;
}
