import {Var} from '../code';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings} from './taker-utils';

/**
 * Creates taker that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 *
 * @see {@link end}
 */
export function skip(charCount: number): Taker<any> {
  return new SkipTaker(charCount);
}

export class SkipTaker implements TakerCodegen {

  constructor(public charCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCount} = this;
    return createCodeBindings([
      resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':', NO_MATCH, ';',
    ]);
  }
}
