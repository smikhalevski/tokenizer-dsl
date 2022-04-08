import {createVar} from '../code';
import {InternalTaker, REGEX_TYPE} from './internal-taker-types';
import {NO_MATCH, Taker} from './taker-types';

/**
 * Creates taker that matches a substring.
 *
 * @param re The `RegExp` to match.
 */
export function regex(re: RegExp): Taker {
  return createRegexTaker(re);
}

export interface RegexTaker extends InternalTaker {
  type: REGEX_TYPE;
  re: RegExp;
}

export function createRegexTaker(re: RegExp): RegexTaker {

  re = RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));

  const reVar = createVar();

  return {
    type: REGEX_TYPE,
    bindings: [[reVar, re]],
    re,

    factory(inputVar, offsetVar, resultVar) {
      const arrVar = createVar();

      return [
        reVar, '.lastIndex=', offsetVar, ';',
        'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
        resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?', NO_MATCH, ':', reVar, '.lastIndex;',
      ];
    }
  };
}
