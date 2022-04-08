import {createVar} from '../code';
import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharPredicate} from './char';
import {
  ALL_CASE_SENSITIVE_TEXT_TYPE,
  ALL_CHAR_CODE_CHECKER_TYPE,
  ALL_CHAR_CODE_RANGE_TYPE,
  ALL_GENERIC_TYPE,
  ALL_REGEX_TYPE,
  CASE_SENSITIVE_TEXT_TYPE,
  CHAR_CODE_CHECKER_TYPE,
  CHAR_CODE_RANGE_TYPE,
  InternalTaker,
  REGEX_TYPE
} from './internal-taker-types';
import {createMaybeTaker} from './maybe';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {CharCodeChecker, CharCodeRange, NO_MATCH, Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker, isInternalTaker, isTakerCodegen, toCharCodes, toTakerFunction} from './taker-utils';
import {CaseSensitiveTextTaker} from './text';

export interface AllOptions {

  /**
   * The minimum number of matches to consider success.
   *
   * @default 0
   */
  minimumCount?: number;

  /**
   * The maximum number of matches to read. `Infinity` and non-positive numbers are treated as unlimited.
   *
   * @default 0
   */
  maximumCount?: number;
}

/**
 * Creates taker that repeatedly takes chars using `taker`.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function all(taker: Taker, options: AllOptions = {}): Taker {

  let {
    minimumCount = 0,
    maximumCount = 0,
  } = options;

  minimumCount = Math.max(minimumCount | 0, 0);
  maximumCount = Math.max(maximumCount | 0, 0);

  if (maximumCount > 0 && minimumCount > maximumCount) {
    return never;
  }
  if (minimumCount === 0 && maximumCount === 1) {
    return createMaybeTaker(taker);
  }
  if (minimumCount === 1 && maximumCount === 1) {
    return toTakerFunction(taker);
  }
  if (taker === never || taker === none) {
    return taker;
  }
  if (isInternalTaker<CharCodeCheckerTaker>(CHAR_CODE_CHECKER_TYPE, taker)) {
    return createAllCharCodeCheckerTaker(taker.charCodeChecker, minimumCount, maximumCount);
  }
  if (isInternalTaker<CharCodeRangeTaker>(CHAR_CODE_RANGE_TYPE, taker)) {
    return createAllCharCodeRangeTaker(taker.charCodeRanges, minimumCount, maximumCount);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(CASE_SENSITIVE_TEXT_TYPE, taker)) {
    return createAllCaseSensitiveTextTaker(taker.str, minimumCount, maximumCount);
  }
  if (isInternalTaker<RegexTaker>(REGEX_TYPE, taker)) {
    return createAllRegexTaker(taker.re, minimumCount, maximumCount);
  }
  return createAllGenericTaker(taker, minimumCount, maximumCount);
}

export interface AllCharCodeCheckerTaker extends InternalTaker {
  type: ALL_CHAR_CODE_CHECKER_TYPE;
}

export function createAllCharCodeCheckerTaker(charCodeChecker: CharCodeChecker, minimumCount: number, maximumCount: number): AllCharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const takeCountVar = createVar();
    const indexVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar,
      minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
      ';',
      'while(', indexVar, '<', inputLengthVar,
      maximumCount ? ['&&', takeCountVar, '<', maximumCount] : '',
      '&&', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', indexVar, '))){',
      minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
      '++', indexVar,
      '}',
      resultVar, '=',
      minimumCount ? [takeCountVar, '<', minimumCount, '?' + NO_MATCH + ':', indexVar] : indexVar,
      ';',
    ];
  };

  return createInternalTaker<AllCharCodeCheckerTaker>(ALL_CHAR_CODE_CHECKER_TYPE, factory, [[charCodeCheckerVar, charCodeChecker]]);
}

export interface AllCharCodeRangeTaker extends InternalTaker {
  type: ALL_CHAR_CODE_RANGE_TYPE;
}

export function createAllCharCodeRangeTaker(charCodeRanges: CharCodeRange[], minimumCount: number, maximumCount: number): AllCharCodeRangeTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const charCodeVar = createVar();
    const takeCountVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      charCodeVar,
      minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
      ';',
      'while(', indexVar, '<', inputLengthVar,
      maximumCount ? ['&&', takeCountVar, '<', maximumCount] : '',
      '&&(',
      charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),',
      createCharPredicate(charCodeVar, charCodeRanges),
      ')){',
      minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
      '++', indexVar,
      '}',
      resultVar, '=',
      minimumCount ? [takeCountVar, '<', minimumCount, '?' + NO_MATCH + ':', indexVar] : indexVar,
      ';'
    ];
  };

  return createInternalTaker<AllCharCodeRangeTaker>(ALL_CHAR_CODE_RANGE_TYPE, factory);
}

export interface AllCaseSensitiveTextTaker extends InternalTaker {
  type: ALL_CASE_SENSITIVE_TEXT_TYPE;
}

export function createAllCaseSensitiveTextTaker(str: string, minimumCount: number, maximumCount: number): AllCaseSensitiveTextTaker {

  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takeCountVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar,
      minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
      ';',
      'while(',
      indexVar, '+', str.length, '<=', inputLengthVar,
      maximumCount ? ['&&', takeCountVar, '<', maximumCount] : '',
      toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', indexVar, i > 0 ? '+' + i : '', ')===', charCode]),
      '){',
      minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
      indexVar, '+=', str.length,
      '}',
      resultVar, '=',
      minimumCount ? [takeCountVar, '<', minimumCount, '?' + NO_MATCH + ':', indexVar] : indexVar,
      ';',
    ];
  };

  return createInternalTaker<AllCaseSensitiveTextTaker>(ALL_CASE_SENSITIVE_TEXT_TYPE, factory, [[strVar, str]]);
}

export interface AllRegexTaker extends InternalTaker {
  type: ALL_REGEX_TYPE;
}

export function createAllRegexTaker(re: RegExp, minimumCount: number, maximumCount: number): AllRegexTaker {

  re = RegExp(
      '(?:'
      + re.source
      + '){'
      + minimumCount
      + ','
      + (maximumCount || '')
      + '}',
      re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'),
  );

  const reVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const arrVar = createVar();

    return [
      reVar, '.lastIndex=', offsetVar, ';',
      'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
      resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?' + NO_MATCH + ':', reVar, '.lastIndex;',
    ];
  };

  return createInternalTaker<AllRegexTaker>(ALL_REGEX_TYPE, factory, [[reVar, re]]);
}

export interface AllGenericTaker extends InternalTaker {
  type: ALL_GENERIC_TYPE;
}

export function createAllGenericTaker(baseTaker: Taker, minimumCount: number, maximumCount: number): AllGenericTaker {

  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const baseTakerResultVar = createVar();
    const takeCountVar = createVar();

    return [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, ',',
      baseTakerResultVar, '=', offsetVar,
      minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
      ';',
      'do{',
      indexVar, '=', baseTakerResultVar, ';',
      isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, indexVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ')'],
      '}while(',
      baseTakerResultVar, '>', indexVar,
      minimumCount || maximumCount ? ['&&++', takeCountVar, maximumCount ? '<' + maximumCount : ''] : '',
      ')',
      resultVar, '=',
      minimumCount ? [takeCountVar, '<', minimumCount, '?' + NO_MATCH + ':'] : '',
      baseTakerResultVar, '===' + NO_MATCH + '?', indexVar, ':', baseTakerResultVar,
      ';',
    ];
  };

  return createInternalTaker<AllGenericTaker>(ALL_GENERIC_TYPE, factory, isTakerCodegen(baseTaker) ? baseTaker.bindings : [[baseTakerVar, baseTaker]]);
}
