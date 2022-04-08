import {createVar} from '../code';
import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharPredicate} from './char';
import {
  CASE_SENSITIVE_TEXT_TYPE,
  CHAR_CODE_CHECKER_TYPE,
  CHAR_CODE_RANGE_TYPE,
  InternalTaker,
  REGEX_TYPE,
  UNTIL_CASE_SENSITIVE_TEXT_TYPE,
  UNTIL_CHAR_CODE_CHECKER_TYPE,
  UNTIL_CHAR_CODE_RANGE_TYPE,
  UNTIL_GENERIC_TYPE,
  UNTIL_REGEX_TYPE
} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {CharCodeChecker, CharCodeRange, NO_MATCH, Taker} from './taker-types';
import {isInternalTaker, isTakerCodegen} from './taker-utils';
import {CaseSensitiveTextTaker} from './text';

export interface UntilOptions {

  /**
   * If set to `true` then chars matched by `taker` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;
}

/**
 * Creates taker that takes chars until `taker` matches.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function until(taker: Taker, options: UntilOptions = {}): Taker {

  const {inclusive = false} = options;

  if (taker === never || taker === none) {
    return taker;
  }
  if (isInternalTaker<RegexTaker>(REGEX_TYPE, taker)) {
    return createUntilRegexTaker(taker.re, inclusive);
  }
  if (isInternalTaker<CharCodeRangeTaker>(CHAR_CODE_RANGE_TYPE, taker)) {
    const {charCodeRanges} = taker;

    if (charCodeRanges.length === 1 && typeof charCodeRanges[0] === 'number') {
      return createUntilCaseSensitiveTextTaker(String.fromCharCode(charCodeRanges[0]), inclusive);
    }
    return createUntilCharCodeRangeTaker(charCodeRanges, inclusive);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(CASE_SENSITIVE_TEXT_TYPE, taker)) {
    return createUntilCaseSensitiveTextTaker(taker.str, inclusive);
  }
  if (isInternalTaker<CharCodeCheckerTaker>(CHAR_CODE_CHECKER_TYPE, taker)) {
    return createUntilCharCodeCheckerTaker(taker.charCodeChecker, inclusive);
  }
  return createUntilGenericTaker(taker, inclusive);
}

export interface UntilCharCodeRangeTaker extends InternalTaker {
  type: UNTIL_CHAR_CODE_RANGE_TYPE;
}

export function createUntilCharCodeRangeTaker(charCodeRanges: CharCodeRange[], inclusive: boolean): UntilCharCodeRangeTaker {
  return {
    type: UNTIL_CHAR_CODE_RANGE_TYPE,

    factory(inputVar, offsetVar, resultVar) {

      const inputLengthVar = createVar();
      const indexVar = createVar();
      const charCodeVar = createVar();

      return [
        'var ',
        inputLengthVar, '=', inputVar, '.length,',
        indexVar, '=', offsetVar, ',',
        charCodeVar,
        ';',
        'while(', indexVar, '<', inputLengthVar,
        '&&(', charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),!(', createCharPredicate(charCodeVar, charCodeRanges), '))',
        ')++', indexVar, ';',
        resultVar, '=', indexVar, '===', inputLengthVar, '?', NO_MATCH, ':', indexVar, inclusive ? '+1;' : ';',
      ];
    }
  };
}

export interface UntilCaseSensitiveTextTaker extends InternalTaker {
  type: UNTIL_CASE_SENSITIVE_TEXT_TYPE;
}

export function createUntilCaseSensitiveTextTaker(str: string, inclusive: boolean): UntilCaseSensitiveTextTaker {

  const strVar = createVar();

  return {
    type: UNTIL_CASE_SENSITIVE_TEXT_TYPE,
    bindings: [[strVar, str]],

    factory(inputVar, offsetVar, resultVar) {
      const indexVar = createVar();

      return [
        'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
        resultVar, '=', indexVar, '===-1?', NO_MATCH, ':', indexVar, inclusive ? '+' + str.length : '', ';',
      ];
    }
  };
}

export interface UntilCharCodeCheckerTaker extends InternalTaker {
  type: UNTIL_CHAR_CODE_CHECKER_TYPE;
}

export function createUntilCharCodeCheckerTaker(charCodeChecker: CharCodeChecker, inclusive: boolean): UntilCharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();

  return {
    type: UNTIL_CHAR_CODE_CHECKER_TYPE,
    bindings: [[charCodeCheckerVar, charCodeChecker]],

    factory(inputVar, offsetVar, resultVar) {

      const inputLengthVar = createVar();
      const indexVar = createVar();

      return [
        'var ',
        inputLengthVar, '=', inputVar, '.length,',
        indexVar, '=', offsetVar, ';',
        'while(', indexVar, '<', inputLengthVar, '&&!', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', indexVar, ')))++', indexVar, ';',
        resultVar, '=', indexVar, '===', inputLengthVar, '?', NO_MATCH, ':', indexVar, inclusive ? '+1;' : ';',
      ];
    },
  };
}

export interface UntilRegexTaker extends InternalTaker {
  type: UNTIL_REGEX_TYPE;
}

export function createUntilRegexTaker(re: RegExp, inclusive: boolean): UntilRegexTaker {

  re = RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');

  const reVar = createVar();

  return {
    type: UNTIL_REGEX_TYPE,
    bindings: [[reVar, re]],

    factory(inputVar, offsetVar, resultVar) {

      const arrVar = createVar();

      return [
        reVar, '.lastIndex=', offsetVar, ';',
        'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
        resultVar, '=', arrVar, '===null?', NO_MATCH, ':', inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'], ';',
      ];
    },
  };
}

export interface UntilGenericTaker extends InternalTaker {
  type: UNTIL_GENERIC_TYPE;
}

export function createUntilGenericTaker(taker: Taker, inclusive: boolean): UntilGenericTaker {

  const takerVar = createVar();

  return {
    type: UNTIL_GENERIC_TYPE,
    bindings: isTakerCodegen(taker) ? taker.bindings : [[takerVar, taker]],

    factory(inputVar, offsetVar, resultVar) {

      const inputLengthVar = createVar();
      const indexVar = createVar();
      const takerResultVar = createVar();

      return [
        'var ',
        inputLengthVar, '=', inputVar, '.length,',
        indexVar, '=', offsetVar, ',',
        takerResultVar, '=', NO_MATCH, ';',
        'while(', indexVar, '<', inputLengthVar, '&&', takerResultVar, '===', NO_MATCH, '){',
        isTakerCodegen(taker) ? taker.factory(inputVar, indexVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', inputVar, ',', indexVar, ');'],
        '++', indexVar,
        '}',
        resultVar, '=', takerResultVar, '<', 0, '?', takerResultVar, ':', inclusive ? takerResultVar : [indexVar, '-1'], ';',
      ];
    },
  };
}
