import {never} from './never';
import {none} from './none';
import {Taker, TakerType} from './taker-types';
import {isTaker} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Taker[]): Taker {
  if (takers.includes(never)) {
    return never;
  }

  takers = takers.reduce<Taker[]>((takers, taker) => {
    if (isTaker<SeqTaker>(taker, TakerType.SEQ)) {
      takers.push(...taker.__takers);
      return takers;
    }
    if (taker !== none) {
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

  return createSeqTaker(takers);
}

export interface SeqTaker extends Taker {
  __type: TakerType.SEQ;
  __takers: Taker[];
}

export function createSeqTaker(takers: Taker[]): SeqTaker {

  const takerCount = takers.length;

  const take: SeqTaker = (input, offset) => {
    for (let i = 0; i < takerCount && offset >= 0; ++i) {
      offset = takers[i](input, offset);
    }
    return offset;
  };

  take.__type = TakerType.SEQ;
  take.__takers = takers;

  return take;
}
