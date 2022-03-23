import {createTaker, createVar, js} from './js';
import {InternalTaker, ResultCode, Taker, TakerCodeFactory, TakerType} from './taker-types';

/**
 * Creates taker that matches a substring.
 *
 * @param re The `RegExp` to match.
 */
export function regex(re: RegExp): Taker {
  return createRegexTaker(re);
}

export interface RegexTaker extends InternalTaker {
  __type: TakerType.REGEX;
  __re: RegExp;
}

export function createRegexTaker(re: RegExp): RegexTaker {

  re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));

  const reVar = createVar();
  const arrVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      reVar, '.lastIndex=', offsetVar, ';',
      'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
      resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?' + ResultCode.NO_MATCH, ':', reVar, '.lastIndex;',
  );

  const taker = createTaker<RegexTaker>(TakerType.REGEX, factory, [[reVar, re]]);

  taker.__re = re;

  return taker;
}
