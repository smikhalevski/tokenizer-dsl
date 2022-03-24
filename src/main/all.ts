import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharPredicate} from './char';
import {createInternalTaker, createVar, toTaker} from './js';
import {createMaybeTaker} from './maybe';
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

export interface AllOptions {

  /**
   * The minimum number of matches to consider success.
   *
   * @default 0
   */
  minimumCount?: number;

  /**
   * The maximum number of matches to read.
   *
   * @default Infinity
   */
  maximumCount?: number;
}

/**
 * Creates taker that repeatedly takes chars using `taker`.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function all(taker: Taker | TakerCodegen, options: AllOptions = {}): Taker {

  let {
    minimumCount = 0,
    maximumCount = Infinity,
  } = options;

  minimumCount = isFinite(minimumCount) ? Math.max(minimumCount | 0, 0) : Infinity;
  maximumCount = isFinite(maximumCount) ? Math.max(maximumCount | 0, 0) : Infinity;

  if (minimumCount > maximumCount || minimumCount === Infinity) {
    return never;
  }
  if (maximumCount === 0) {
    return none;
  }
  if (maximumCount === 1 && minimumCount <= 0) {
    return createMaybeTaker(taker);
  }
  if (maximumCount === 1 && minimumCount === 1) {
    return toTaker(taker);
  }
  if (taker === never || taker === none || isAllTaker(taker)) {
    return taker;
  }
  if (isInternalTaker<CharCodeCheckerTaker>(taker, InternalTakerType.CHAR_CODE_CHECKER)) {
    return createAllCharCodeCheckerTaker(taker.charCodeChecker, minimumCount, maximumCount);
  }
  if (isInternalTaker<CharCodeRangeTaker>(taker, InternalTakerType.CHAR_CODE_RANGE)) {
    return createAllCharCodeRangeTaker(taker.charCodeRanges, minimumCount, maximumCount);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(taker, InternalTakerType.CASE_SENSITIVE_TEXT)) {
    return createAllCaseSensitiveTextTaker(taker.str, minimumCount, maximumCount);
  }
  if (isInternalTaker<RegexTaker>(taker, InternalTakerType.REGEX)) {
    return createAllRegexTaker(taker.re, minimumCount, maximumCount);
  }
  return createAllGenericTaker(taker, minimumCount, maximumCount);
}

export type AllTaker =
    | AllCharCodeCheckerTaker
    | AllCaseSensitiveTextTaker
    | AllRegexTaker
    | AllGenericTaker;

export function isAllTaker(taker: TakerLike): taker is AllTaker {
  return isInternalTaker<AllCharCodeCheckerTaker>(taker, InternalTakerType.ALL_CHAR_CODE_CHECKER)
      || isInternalTaker<AllCharCodeRangeTaker>(taker, InternalTakerType.ALL_CHAR_CODE_RANGE)
      || isInternalTaker<AllCaseSensitiveTextTaker>(taker, InternalTakerType.ALL_CASE_SENSITIVE_TEXT)
      || isInternalTaker<AllRegexTaker>(taker, InternalTakerType.ALL_REGEX)
      || isInternalTaker<AllGenericTaker>(taker, InternalTakerType.ALL_GENERIC);
}

export interface AllCharCodeCheckerTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.ALL_CHAR_CODE_CHECKER;
  minimumCount: number;
  maximumCount: number;
}

export function createAllCharCodeCheckerTaker(charCodeChecker: CharCodeChecker, minimumCount: number, maximumCount: number): AllCharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();
  const inputLengthVar = createVar();
  const takeCountVar = createVar();
  const indexVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar,
    minimumCount === 0 && maximumCount === Infinity ? '' : [',', takeCountVar, '=0'],
    ';',
    'while(', indexVar, '<', inputLengthVar,
    maximumCount === Infinity ? '' : ['&&', takeCountVar, '<', maximumCount],
    '&&', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', indexVar, '))){',
    minimumCount === 0 && maximumCount === Infinity ? '' : ['++', takeCountVar, ';'],
    '++', indexVar,
    '}',
    resultVar, '=',
    minimumCount === 0 ? indexVar : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':', indexVar],
    ';',
  ];

  const take = createInternalTaker<AllCharCodeCheckerTaker>(InternalTakerType.ALL_CHAR_CODE_CHECKER, factory, [[charCodeCheckerVar, charCodeChecker]]);

  take.minimumCount = minimumCount;
  take.maximumCount = maximumCount;

  return take;
}

export interface AllCharCodeRangeTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.ALL_CHAR_CODE_RANGE;
  minimumCount: number;
  maximumCount: number;
}

export function createAllCharCodeRangeTaker(charCodeRanges: CharCodeRange[], minimumCount: number, maximumCount: number): AllCharCodeRangeTaker {

  const inputLengthVar = createVar();
  const takeCountVar = createVar();
  const indexVar = createVar();
  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', takeCountVar, '=0,', indexVar, '=', offsetVar, ';',
    'while(', indexVar, '<', inputLengthVar,
    maximumCount === Infinity ? '' : ['&&', takeCountVar, '<', maximumCount],
    '){',
    'var ', charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
    'if(!(', createCharPredicate(charCodeVar, charCodeRanges), '))break;',
    '++', takeCountVar, ';',
    '++', indexVar,
    '}',
    resultVar, '=',
    minimumCount === 0 ? indexVar : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':', indexVar],
    ';'
  ];

  const taker = createInternalTaker<AllCharCodeRangeTaker>(InternalTakerType.ALL_CHAR_CODE_RANGE, factory);

  taker.minimumCount = minimumCount;
  taker.maximumCount = maximumCount;

  return taker;
}

export interface AllCaseSensitiveTextTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.ALL_CASE_SENSITIVE_TEXT;
  minimumCount: number;
  maximumCount: number;
}

export function createAllCaseSensitiveTextTaker(str: string, minimumCount: number, maximumCount: number): AllCaseSensitiveTextTaker {

  const takeCountVar = createVar();
  const indexVar = createVar();
  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', takeCountVar, '=0,', indexVar, '=', offsetVar, ';',
    'while(',
    maximumCount === Infinity ? '' : [takeCountVar, '<', maximumCount, '&&'],
    inputVar, '.startsWith(', strVar, ',', indexVar, ')',
    '){',
    '++', takeCountVar, ';',
    indexVar, '+=' + str.length,
    '}',
    resultVar, '=',
    minimumCount === 0 ? indexVar : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':', indexVar],
    ';',
  ];

  const taker = createInternalTaker<AllCaseSensitiveTextTaker>(InternalTakerType.ALL_CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);

  taker.minimumCount = minimumCount;
  taker.maximumCount = maximumCount;

  return taker;
}

export interface AllRegexTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.ALL_REGEX;
  minimumCount: number;
  maximumCount: number;
}

export function createAllRegexTaker(re: RegExp, minimumCount: number, maximumCount: number): AllRegexTaker {

  re = new RegExp(
      '(?:'
      + re.source
      + '){'
      + minimumCount
      + ','
      + (maximumCount === Infinity ? '' : maximumCount)
      + '}',
      re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'),
  );

  const reVar = createVar();
  const arrVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    reVar, '.lastIndex=', offsetVar, ';',
    'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
    resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?' + ResultCode.NO_MATCH + ':', reVar, '.lastIndex;',
  ];

  const taker = createInternalTaker<AllRegexTaker>(InternalTakerType.ALL_REGEX, factory, [[reVar, re]]);

  taker.minimumCount = minimumCount;
  taker.maximumCount = maximumCount;

  return taker;
}

export interface AllGenericTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.ALL_GENERIC;
  minimumCount: number;
  maximumCount: number;
}

export function createAllGenericTaker(baseTaker: TakerLike, minimumCount: number, maximumCount: number): AllGenericTaker {

  const inputLengthVar = createVar();
  const takeCountVar = createVar();
  const indexVar = createVar();
  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', takeCountVar, '=0,', indexVar, ';',
    resultVar, '=', offsetVar, ';',

    'do{',
    indexVar, '=', resultVar, ';',
    isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, indexVar, resultVar) : [resultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ')'],
    '}while(',
    resultVar, '>', indexVar,
    maximumCount === Infinity ? ['&&++', takeCountVar, '<Infinity'] : ['&&++', takeCountVar, '<', maximumCount],
    // maximumCount === Infinity ? '' : ['&&++', takeCountVar, '<', maximumCount],
    ')',
    resultVar, '=',
    minimumCount === 0 ? '' : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':'],
    resultVar, '===' + ResultCode.NO_MATCH + '?', indexVar, ':', resultVar,
    ';',
  ];

  const taker = createInternalTaker<AllGenericTaker>(InternalTakerType.ALL_GENERIC, factory, isTakerCodegen(baseTaker) ? baseTaker.values : [[baseTakerVar, baseTaker]]);

  taker.minimumCount = minimumCount;
  taker.maximumCount = maximumCount;

  return taker;
}
