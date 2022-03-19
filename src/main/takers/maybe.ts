import {ResultCode, Taker} from '../taker-types';
import {never} from './never';
import {none} from './none';
import {AllCaseSensitiveTextTaker, AllCharTaker, AllTaker} from './all';
import {TakerType} from './TakerType';
import {isTaker} from '../taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  if (
      taker === never
      || taker === none
      || (
          isTaker<AllCharTaker>(taker, TakerType.AllCharTaker)
          || isTaker<AllCaseSensitiveTextTaker>(taker, TakerType.AllCaseSensitiveTextTaker)
          || isTaker<AllTaker>(taker, TakerType.AllTaker)
      ) && taker.__minimumCount === 0) {
    return taker;
  }
  return createMaybeTaker(taker);
}

export interface MaybeTaker extends Taker {
  __type: TakerType.MaybeTaker;
  __taker: Taker;
}

export function createMaybeTaker(taker: Taker): MaybeTaker {

  const take: MaybeTaker = (input, offset) => {
    const result = taker(input, offset);

    return result === ResultCode.NO_MATCH ? offset : result;
  };

  take.__type = TakerType.MaybeTaker;
  take.__taker = taker;

  return take;
}
