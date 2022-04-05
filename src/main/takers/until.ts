import {createVar} from '../code';
import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharPredicate} from './char';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {
  CharCodeChecker,
  CharCodeRange,
  InternalTaker,
  InternalTakerType,
  ResultCode,
  Taker,
  TakerCodeFactory,
  TakerLike
} from './taker-types';
import {compileInternalTaker, isInternalTaker, isTakerCodegen} from './taker-utils';
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
export function until(taker: TakerLike, options: UntilOptions = {}): Taker {

  const {inclusive = false} = options;

  if (taker === never || taker === none) {
    return taker;
  }
  if (isInternalTaker<RegexTaker>(taker, InternalTakerType.REGEX)) {
    return createUntilRegexTaker(taker.re, inclusive);
  }
  if (isInternalTaker<CharCodeRangeTaker>(taker, InternalTakerType.CHAR_CODE_RANGE)) {
    const {charCodeRanges} = taker;

    if (charCodeRanges.length === 1 && typeof charCodeRanges[0] === 'number') {
      return createUntilCaseSensitiveTextTaker(String.fromCharCode(charCodeRanges[0]), inclusive);
    }
    return createUntilCharCodeRangeTaker(charCodeRanges, inclusive);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(taker, InternalTakerType.CASE_SENSITIVE_TEXT)) {
    return createUntilCaseSensitiveTextTaker(taker.str, inclusive);
  }
  if (isInternalTaker<CharCodeCheckerTaker>(taker, InternalTakerType.CHAR_CODE_CHECKER)) {
    return createUntilCharCodeCheckerTaker(taker.charCodeChecker, inclusive);
  }
  return createUntilGenericTaker(taker, inclusive);
}

export interface UntilCharCodeRangeTaker extends InternalTaker {
  type: InternalTakerType.UNTIL_CHAR_CODE_RANGE;
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
      resultVar, '=', indexVar, '===', inputLengthVar, '?' + ResultCode.NO_MATCH + ':', indexVar, inclusive ? '+1;' : ';',
    ];
  };

  return compileInternalTaker<UntilCharCodeRangeTaker>(InternalTakerType.UNTIL_CHAR_CODE_RANGE, factory);
}

export interface UntilCaseSensitiveTextTaker extends InternalTaker {
  type: InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT;
}

export function createUntilCaseSensitiveTextTaker(str: string, inclusive: boolean): UntilCaseSensitiveTextTaker {

  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const indexVar = createVar();

    return [
      'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
      resultVar, '=', indexVar, '===-1?' + ResultCode.NO_MATCH + ':', indexVar, inclusive ? '+' + str.length : '', ';',
    ];
  };

  return compileInternalTaker<UntilCaseSensitiveTextTaker>(InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);
}

export interface UntilCharCodeCheckerTaker extends InternalTaker {
  type: InternalTakerType.UNTIL_CHAR_CODE_CHECKER;
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
      resultVar, '=', indexVar, '===', inputLengthVar, '?' + ResultCode.NO_MATCH + ':', indexVar, inclusive ? '+1;' : ';',
    ];
  };

  return compileInternalTaker<UntilCharCodeCheckerTaker>(InternalTakerType.UNTIL_CHAR_CODE_CHECKER, factory, [[charCodeCheckerVar, charCodeChecker]]);
}

export interface UntilRegexTaker extends InternalTaker {
  type: InternalTakerType.UNTIL_REGEX;
}

export function createUntilRegexTaker(re: RegExp, inclusive: boolean): UntilRegexTaker {

  re = RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');

  const reVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const arrVar = createVar();

    return [
      reVar, '.lastIndex=', offsetVar, ';',
      'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
      resultVar, '=', arrVar, '===null?' + ResultCode.NO_MATCH + ':', inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'], ';',
    ];
  };

  return compileInternalTaker<UntilRegexTaker>(InternalTakerType.UNTIL_REGEX, factory, [[reVar, re]]);
}

export interface UntilGenericTaker extends InternalTaker {
  type: InternalTakerType.UNTIL_GENERIC;
}

export function createUntilGenericTaker(baseTaker: TakerLike, inclusive: boolean): UntilGenericTaker {

  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const baseTakerResultVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      baseTakerResultVar, '=' + ResultCode.NO_MATCH + ';',
      'while(', indexVar, '<', inputLengthVar, '&&', baseTakerResultVar, '===' + ResultCode.NO_MATCH + '){',
      isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, indexVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ');'],
      '++', indexVar,
      '}',
      resultVar, '=', baseTakerResultVar, '<', 0, '?', baseTakerResultVar, ':', inclusive ? baseTakerResultVar : [indexVar, '-1'], ';',
    ];
  };

  return compileInternalTaker<UntilGenericTaker>(InternalTakerType.UNTIL_GENERIC, factory, isTakerCodegen(baseTaker) ? baseTaker.bindings : [[baseTakerVar, baseTaker]]);
}
