import {createEndTaker} from './end';
import {createInternalTaker} from './js';
import {none} from './none';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory} from './taker-types';

/**
 * Creates taker that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 */
export function skip(charCount = 1): Taker {
  if (charCount < 1) {
    return none;
  }
  if (isFinite(charCount)) {
    return createSkipTaker(charCount | 0);
  }
  return createEndTaker(0);
}

export interface SkipTaker extends InternalTaker {
  type: InternalTakerType.SKIP;
  charCount: number;
}

export function createSkipTaker(charCount: number): SkipTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', offsetVar, '+', charCount, ';',
  ];

  const taker = createInternalTaker<SkipTaker>(InternalTakerType.SKIP, factory);

  taker.charCount = charCount;

  return taker;
}
