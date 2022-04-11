import {Var} from '../code';
import {InternalTaker, NO_MATCH, CodeBindings, Taker} from './taker-types';
import {createCodeBindings, createTakerType} from './taker-utils';

/**
 * Creates taker that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 */
export function skip(charCount = 1): Taker {
  return new SkipTaker(charCount);
}

export const SKIP_TYPE = createTakerType();

export class SkipTaker implements InternalTaker {

  readonly type = SKIP_TYPE;

  constructor(public charCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {charCount} = this;
    return createCodeBindings([
      resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':', NO_MATCH, ';',
    ]);
  }
}
