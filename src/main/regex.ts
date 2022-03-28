import {compileInternalTaker, createVar} from './code';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory} from './taker-types';

/**
 * Creates taker that matches a substring.
 *
 * @param re The `RegExp` to match.
 */
export function regex(re: RegExp): Taker {
  return createRegexTaker(re);
}

export interface RegexTaker extends InternalTaker {
  type: InternalTakerType.REGEX;
  re: RegExp;
}

export function createRegexTaker(re: RegExp): RegexTaker {

  re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));

  const reVar = createVar();
  const arrVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    reVar, '.lastIndex=', offsetVar, ';',
    'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
    resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?' + ResultCode.NO_MATCH + ':', reVar, '.lastIndex;',
  ];

  const taker = compileInternalTaker<RegexTaker>(InternalTakerType.REGEX, factory, [[reVar, re]]);

  taker.re = re;

  return taker;
}
