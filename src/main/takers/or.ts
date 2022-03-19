import {ResultCode, Taker} from '../taker-types';
import {isTaker} from '../taker-utils';
import {none} from './none';
import {never} from './never';
import {TakerType} from './TakerType';

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
    if (isTaker<OrTaker>(taker, TakerType.OrTaker)) {
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
  __type: TakerType.OrTaker;
  __takers: Taker[];
}

export function createOrTaker(takers: Taker[]): OrTaker {

  const take: OrTaker = (input, offset) => {
    const takerCount = takers.length;

    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; ++i) {
      result = takers[i](input, offset);
    }
    return result;
  };

  take.__type = TakerType.OrTaker;
  take.__takers = takers;

  return take;
}
