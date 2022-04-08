import {InternalTaker, SKIP_TYPE} from './internal-taker-types';
import {none} from './none';
import {NO_MATCH, Taker} from './taker-types';

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
  return {
    type: SKIP_TYPE,
    charCount,

    factory(inputVar, offsetVar, resultVar) {
      return [
        resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':', NO_MATCH, ';',
      ];
    },
  };
}
