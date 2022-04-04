import {createVar} from '../code-utils';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory} from './taker-types';
import {compileInternalTaker} from './taker-utils';

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

  re = RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));

  const reVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const arrVar = createVar();

    return [
      reVar, '.lastIndex=', offsetVar, ';',
      'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
      resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?' + ResultCode.NO_MATCH + ':', reVar, '.lastIndex;',
    ];
  };

  const taker = compileInternalTaker<RegexTaker>(InternalTakerType.REGEX, factory, [[reVar, re]]);

  taker.re = re;

  return taker;
}
