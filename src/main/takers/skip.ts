import {InternalTaker, SKIP_TYPE} from './internal-taker-types';
import {none} from './none';
import {NO_MATCH, Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker} from './taker-utils';

/**
 * Creates taker that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 */
export function skip(charCount = 1): Taker {
  charCount = Math.max(charCount | 0, 0);

  if (charCount === 0) {
    return none;
  }
  return createSkipTaker(charCount);
}

export interface SkipTaker extends InternalTaker {
  type: SKIP_TYPE;
  charCount: number;
}

export function createSkipTaker(charCount: number): SkipTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':' + NO_MATCH + ';',
  ];

  const taker = createInternalTaker<SkipTaker>(SKIP_TYPE, factory);

  taker.charCount = charCount;

  return taker;
}
