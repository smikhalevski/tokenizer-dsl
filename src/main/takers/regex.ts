import {createVar, Var} from '../code';
import {InternalTaker, NO_MATCH, Qqq, Taker} from './taker-types';
import {createQqq, createSymbol} from './taker-utils';

/**
 * Creates taker that matches a substring.
 *
 * @param re The `RegExp` to match.
 */
export function regex(re: RegExp): Taker {
  return new RegexTaker(re);
}

export const REGEX_TYPE = createSymbol();

export class RegexTaker implements InternalTaker {

  readonly type = REGEX_TYPE;
  re;

  constructor(re: RegExp) {
    this.re = RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): Qqq {

    const reVar = createVar();
    const arrVar = createVar();

    return createQqq(
        [
          reVar, '.lastIndex=', offsetVar, ';',
          'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
          resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?', NO_MATCH, ':', reVar, '.lastIndex;',
        ],
        [[reVar, this.re]],
    );
  }
}
