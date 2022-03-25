import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharPredicate} from './char';
import {createInternalTaker, createVar} from './js';
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
  TakerCodegen,
  TakerLike
} from './taker-types';
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
export function until(taker: TakerLike, options: UntilOptions = {}): Taker {

  const {inclusive = false} = options;

  if (taker === never || taker === none || isUntilTaker(taker)) {
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
    return createUntilCharCodeRangeTaker(taker.charCodeRanges, inclusive);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(taker, InternalTakerType.CASE_SENSITIVE_TEXT)) {
    return createUntilCaseSensitiveTextTaker(taker.str, inclusive);
  }
  if (isInternalTaker<CharCodeCheckerTaker>(taker, InternalTakerType.CHAR_CODE_CHECKER)) {
    return createUntilCharCodeCheckerTaker(taker.charCodeChecker, inclusive);
  }
  return createUntilGenericTaker(taker, inclusive);
}

export type UntilTaker =
    | UntilCharCodeRangeTaker
    | UntilCaseSensitiveTextTaker
    | UntilCharCodeCheckerTaker
    | UntilRegexTaker
    | UntilGenericTaker;

export function isUntilTaker(taker: TakerLike): taker is UntilTaker {
  return isInternalTaker<UntilCharCodeRangeTaker>(taker, InternalTakerType.UNTIL_CHAR_CODE_RANGE)
      || isInternalTaker<UntilCaseSensitiveTextTaker>(taker, InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT)
      || isInternalTaker<UntilCharCodeCheckerTaker>(taker, InternalTakerType.UNTIL_CHAR_CODE_CHECKER)
      || isInternalTaker<UntilRegexTaker>(taker, InternalTakerType.UNTIL_REGEX)
      || isInternalTaker<UntilGenericTaker>(taker, InternalTakerType.UNTIL_GENERIC);
}

export interface UntilCharCodeRangeTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.UNTIL_CHAR_CODE_RANGE;
}

export function createUntilCharCodeRangeTaker(charCodeRanges: CharCodeRange[], inclusive: boolean): UntilCharCodeRangeTaker {

  const inputLengthVar = createVar();
  const indexVar = createVar();
  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar, ',', charCodeVar, ';',
    'while(', indexVar, '<', inputLengthVar, '){',
    charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
    'if(', createCharPredicate(charCodeVar, charCodeRanges), ')break;',
    '++', indexVar,
    '}',
    resultVar, '=', indexVar, '===', inputLengthVar, '?' + ResultCode.NO_MATCH + ':', inclusive ? [indexVar, '+1'] : indexVar, ';',
  ];

  return createInternalTaker<UntilCharCodeRangeTaker>(InternalTakerType.UNTIL_CHAR_CODE_RANGE, factory);
}

export interface UntilCaseSensitiveTextTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT;
}

export function createUntilCaseSensitiveTextTaker(str: string, inclusive: boolean): UntilCaseSensitiveTextTaker {

  const indexVar = createVar();
  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
    resultVar, '=', indexVar, '===-1?' + ResultCode.NO_MATCH + ':', inclusive ? [indexVar, '+', str.length] : indexVar, ';',
  ];

  return createInternalTaker<UntilCaseSensitiveTextTaker>(InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);
}

export interface UntilCharCodeCheckerTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.UNTIL_CHAR_CODE_CHECKER;
}

export function createUntilCharCodeCheckerTaker(charCodeChecker: CharCodeChecker, inclusive: boolean): UntilCharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();
  const inputLengthVar = createVar();
  const indexVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar, ';',
    'while(', indexVar, '<', inputLengthVar, '&&!', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', indexVar, '))){',
    '++', indexVar,
    '}',
    resultVar, '=', indexVar, '===', inputLengthVar, '?' + ResultCode.NO_MATCH + ':', inclusive ? [indexVar, '+1'] : indexVar, ';',
  ];

  return createInternalTaker<UntilCharCodeCheckerTaker>(InternalTakerType.UNTIL_CHAR_CODE_CHECKER, factory, [[charCodeCheckerVar, charCodeChecker]]);
}

export interface UntilRegexTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.UNTIL_REGEX;
}

export function createUntilRegexTaker(re: RegExp, inclusive: boolean): UntilRegexTaker {

  re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');

  const reVar = createVar();
  const arrVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    reVar, '.lastIndex=', offsetVar, ';',
    'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
    resultVar, '=', arrVar, '===null?' + ResultCode.NO_MATCH + ':', inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'], ';',
  ];

  return createInternalTaker<UntilRegexTaker>(InternalTakerType.UNTIL_REGEX, factory, [[reVar, re]]);
}

export interface UntilGenericTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.UNTIL_GENERIC;
}

export function createUntilGenericTaker(baseTaker: TakerLike, inclusive: boolean): UntilGenericTaker {

  const inputLengthVar = createVar();
  const indexVar = createVar();
  const baseTakerVar = createVar();
  const baseTakerResultVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar, ',', baseTakerResultVar, '=' + ResultCode.NO_MATCH + ';',
    'while(', indexVar, '<', inputLengthVar, '&&', baseTakerResultVar, '===' + ResultCode.NO_MATCH + '){',
    isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, indexVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ');'],
    '++', indexVar,
    '}',
    resultVar, '=', baseTakerResultVar, '<', 0, '?', baseTakerResultVar, ':', inclusive ? baseTakerResultVar : [indexVar, '-1'], ';',
  ];

  return createInternalTaker<UntilGenericTaker>(InternalTakerType.UNTIL_GENERIC, factory, isTakerCodegen(baseTaker) ? baseTaker.values : [[baseTakerVar, baseTaker]]);
}
