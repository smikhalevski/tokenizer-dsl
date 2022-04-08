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
import {CharCodeChecker, CharCodeRange, NO_MATCH, Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker, isInternalTaker, isTakerCodegen} from './taker-utils';
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

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

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
      resultVar, '=', indexVar, '===', inputLengthVar, '?' + NO_MATCH + ':', indexVar, inclusive ? '+1;' : ';',
    ];
  };

  return createInternalTaker<UntilCharCodeRangeTaker>(UNTIL_CHAR_CODE_RANGE_TYPE, factory);
}

export interface UntilCaseSensitiveTextTaker extends InternalTaker {
  type: UNTIL_CASE_SENSITIVE_TEXT_TYPE;
}

export function createUntilCaseSensitiveTextTaker(str: string, inclusive: boolean): UntilCaseSensitiveTextTaker {

  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const indexVar = createVar();

    return [
      'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
      resultVar, '=', indexVar, '===-1?' + NO_MATCH + ':', indexVar, inclusive ? '+' + str.length : '', ';',
    ];
  };

  return createInternalTaker<UntilCaseSensitiveTextTaker>(UNTIL_CASE_SENSITIVE_TEXT_TYPE, factory, [[strVar, str]]);
}

export interface UntilCharCodeCheckerTaker extends InternalTaker {
  type: UNTIL_CHAR_CODE_CHECKER_TYPE;
}

export function createUntilCharCodeCheckerTaker(charCodeChecker: CharCodeChecker, inclusive: boolean): UntilCharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const indexVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ';',
      'while(', indexVar, '<', inputLengthVar, '&&!', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', indexVar, ')))++', indexVar, ';',
      resultVar, '=', indexVar, '===', inputLengthVar, '?' + NO_MATCH + ':', indexVar, inclusive ? '+1;' : ';',
    ];
  };

  return createInternalTaker<UntilCharCodeCheckerTaker>(UNTIL_CHAR_CODE_CHECKER_TYPE, factory, [[charCodeCheckerVar, charCodeChecker]]);
}

export interface UntilRegexTaker extends InternalTaker {
  type: UNTIL_REGEX_TYPE;
}

export function createUntilRegexTaker(re: RegExp, inclusive: boolean): UntilRegexTaker {

  re = RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');

  const reVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const arrVar = createVar();

    return [
      reVar, '.lastIndex=', offsetVar, ';',
      'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
      resultVar, '=', arrVar, '===null?' + NO_MATCH + ':', inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'], ';',
    ];
  };

  return createInternalTaker<UntilRegexTaker>(UNTIL_REGEX_TYPE, factory, [[reVar, re]]);
}

export interface UntilGenericTaker extends InternalTaker {
  type: UNTIL_GENERIC_TYPE;
}

export function createUntilGenericTaker(baseTaker: Taker, inclusive: boolean): UntilGenericTaker {

  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const baseTakerResultVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      baseTakerResultVar, '=' + NO_MATCH + ';',
      'while(', indexVar, '<', inputLengthVar, '&&', baseTakerResultVar, '===' + NO_MATCH + '){',
      isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, indexVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ');'],
      '++', indexVar,
      '}',
      resultVar, '=', baseTakerResultVar, '<', 0, '?', baseTakerResultVar, ':', inclusive ? baseTakerResultVar : [indexVar, '-1'], ';',
    ];
  };

  return createInternalTaker<UntilGenericTaker>(UNTIL_GENERIC_TYPE, factory, isTakerCodegen(baseTaker) ? baseTaker.bindings : [[baseTakerVar, baseTaker]]);
}
