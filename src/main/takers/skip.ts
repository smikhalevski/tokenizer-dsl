import {Var} from '../code';
import {InternalTaker, NO_MATCH, Qqq, Taker} from './taker-types';
import {createQqq, createSymbol} from './taker-utils';

/**
 * Creates taker that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 */
export function skip(charCount = 1): Taker {
  return new SkipTaker(charCount);
}

export const SKIP_TYPE = createSymbol();

export class SkipTaker implements InternalTaker {

  readonly type = SKIP_TYPE;

  constructor(public charCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): Qqq {
    const {charCount} = this;
    return createQqq([
      resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':', NO_MATCH, ';',
    ]);
  }
}
