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

  const takersLength = takers.length;

  if (takersLength === 0) {
    return none;
  }
  if (takersLength === 1) {
    return takers[0];
  }
  if (takersLength === 2) {
    return createSeq2Taker(takers);
  }
  if (takersLength === 3) {
    return createSeq3Taker(takers);
  }

  return createSeqTaker(takers);
}

export interface SeqTaker extends Taker {
  __type: TakerType.SEQ;
  __takers: Taker[];
}

export function createSeq2Taker(takers: Taker[]): SeqTaker {
  const [taker1, taker2] = takers;

  const take: SeqTaker = (input, offset) => {
    const result1 = taker1(input, offset);

    if (result1 < 0) {
      return result1;
    }
    return taker2(input, result1);
  };

  take.__type = TakerType.SEQ;
  take.__takers = takers;

  return take;
}

export function createSeq3Taker(takers: Taker[]): SeqTaker {
  const [taker1, taker2, taker3] = takers;

  const take: SeqTaker = (input, offset) => {
    const result1 = taker1(input, offset);

    if (result1 < 0) {
      return result1;
    }

    const result2 = taker2(input, result1);

    if (result2 < 0) {
      return result2;
    }
    return taker3(input, result2);
  };

  take.__type = TakerType.SEQ;
  take.__takers = takers;

  return take;
}

export function createSeqTaker(takers: Taker[]): SeqTaker {

  const takersLength = takers.length;

  const take: SeqTaker = (input, offset) => {
    for (let i = 0; i < takersLength && offset >= 0; ++i) {
      offset = takers[i](input, offset);
    }
    return offset;
  };

  take.__type = TakerType.SEQ;
  take.__takers = takers;

  return take;
}
