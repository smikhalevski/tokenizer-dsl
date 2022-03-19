import {never} from './never';
import {none} from './none';
import {ResultCode, Taker, TakerType} from './taker-types';
import {isTaker} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Taker[]): Taker {

  takers = takers.reduce<Taker[]>((takers, taker) => {

    if (takers.length !== 0 && takers[takers.length - 1] === none) {
      return takers;
    }
    if (isTaker<OrTaker>(taker, TakerType.OR)) {
      takers.push(...taker.__takers);
      return takers;
    }
    if (taker !== never) {
      takers.push(taker);
    }
    return takers;
  }, []);

  if (takers.length === 0) {
    return none;
  }
  if (takers.length === 1) {
    return takers[0];
  }

  return createOrTaker(takers);
}

export interface OrTaker extends Taker {
  __type: TakerType.OR;
  __takers: Taker[];
}

export function createOrTaker(takers: Taker[]): OrTaker {

  const takerCount = takers.length;

  const take: OrTaker = (input, offset) => {
    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = takers[i](input, offset);
    }
    return result;
  };

  take.__type = TakerType.OR;
  take.__takers = takers;

  return take;
}
