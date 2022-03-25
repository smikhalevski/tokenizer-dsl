import {createEndTaker} from './end';
import {createInternalTaker} from './js';
import {none} from './none';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory} from './taker-types';

/**
 * Creates taker that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 */
export function skip(charCount = 1): Taker {
  charCount = Math.max(charCount | 0, 0);

  if (charCount < 1) {
    return none;
  }
  if (isFinite(charCount)) {
    return createSkipTaker(charCount);
  }
  return createEndTaker(0);
}

export interface SkipTaker extends InternalTaker {
  type: InternalTakerType.SKIP;
  charCount: number;
}

export function createSkipTaker(charCount: number): SkipTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':' + ResultCode.NO_MATCH + ';',
  ];

  const taker = createInternalTaker<SkipTaker>(InternalTakerType.SKIP, factory);

  taker.charCount = charCount;

  return taker;
}
