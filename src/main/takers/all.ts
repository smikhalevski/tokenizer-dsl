import {createVar} from '../code';
import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharPredicate} from './char';
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
  TakerLike
} from './taker-types';
import {compileInternalTaker, isInternalTaker, isTakerCodegen, toCharCodes, toTaker} from './taker-utils';
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
export function all(taker: TakerLike, options: AllOptions = {}): Taker {

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
  if (taker === never || taker === none) {
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

export interface AllCharCodeCheckerTaker extends InternalTaker {
  type: InternalTakerType.ALL_CHAR_CODE_CHECKER;
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

  return compileInternalTaker<AllCharCodeCheckerTaker>(InternalTakerType.ALL_CHAR_CODE_CHECKER, factory, [[charCodeCheckerVar, charCodeChecker]]);
}

export interface AllCharCodeRangeTaker extends InternalTaker {
  type: InternalTakerType.ALL_CHAR_CODE_RANGE;
}

export function createAllCharCodeRangeTaker(charCodeRanges: CharCodeRange[], minimumCount: number, maximumCount: number): AllCharCodeRangeTaker {

  const inputLengthVar = createVar();
  const takeCountVar = createVar();
  const indexVar = createVar();
  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar, ',', charCodeVar,
    minimumCount === 0 && maximumCount === Infinity ? '' : [',', takeCountVar, '=0'],
    ';',
    'while(', indexVar, '<', inputLengthVar,
    maximumCount === Infinity ? '' : ['&&', takeCountVar, '<', maximumCount],
    '&&(',
    charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),',
    createCharPredicate(charCodeVar, charCodeRanges),
    ')){',
    minimumCount === 0 && maximumCount === Infinity ? '' : ['++', takeCountVar, ';'],
    '++', indexVar,
    '}',
    resultVar, '=',
    minimumCount === 0 ? indexVar : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':', indexVar],
    ';'
  ];

  return compileInternalTaker<AllCharCodeRangeTaker>(InternalTakerType.ALL_CHAR_CODE_RANGE, factory);
}

export interface AllCaseSensitiveTextTaker extends InternalTaker {
  type: InternalTakerType.ALL_CASE_SENSITIVE_TEXT;
}

export function createAllCaseSensitiveTextTaker(str: string, minimumCount: number, maximumCount: number): AllCaseSensitiveTextTaker {

  const inputLengthVar = createVar();
  const takeCountVar = createVar();
  const indexVar = createVar();
  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar,
    minimumCount === 0 && maximumCount === Infinity ? '' : [',', takeCountVar, '=0'],
    ';',
    'while(',
    indexVar, '+', str.length, '<=', inputLengthVar,
    maximumCount === Infinity ? '' : ['&&', takeCountVar, '<', maximumCount],
    toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', indexVar, i === 0 ? '' : '+' + i, ')===', charCode]),
    '){',
    minimumCount === 0 && maximumCount === Infinity ? '' : ['++', takeCountVar, ';'],
    indexVar, '+=', str.length,
    '}',
    resultVar, '=',
    minimumCount === 0 ? indexVar : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':', indexVar],
    ';',
  ];

  return compileInternalTaker<AllCaseSensitiveTextTaker>(InternalTakerType.ALL_CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);
}

export interface AllRegexTaker extends InternalTaker {
  type: InternalTakerType.ALL_REGEX;
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

  return compileInternalTaker<AllRegexTaker>(InternalTakerType.ALL_REGEX, factory, [[reVar, re]]);
}

export interface AllGenericTaker extends InternalTaker {
  type: InternalTakerType.ALL_GENERIC;
}

export function createAllGenericTaker(baseTaker: TakerLike, minimumCount: number, maximumCount: number): AllGenericTaker {

  const inputLengthVar = createVar();
  const takeCountVar = createVar();
  const indexVar = createVar();
  const baseTakerVar = createVar();
  const baseTakerResultVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, ',', baseTakerResultVar,
    minimumCount === 0 && maximumCount === Infinity ? '' : [',', takeCountVar, '=0'],
    ';',
    baseTakerResultVar, '=', offsetVar, ';',
    'do{',
    indexVar, '=', baseTakerResultVar, ';',
    isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, indexVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ')'],
    '}while(',
    baseTakerResultVar, '>', indexVar,
    minimumCount === 0 && maximumCount === Infinity ? '' : ['&&++', takeCountVar, maximumCount === Infinity ? '' : '<' + maximumCount, ''],
    ')',
    resultVar, '=',
    minimumCount === 0 ? '' : [takeCountVar, '<', minimumCount, '?' + ResultCode.NO_MATCH + ':'],
    baseTakerResultVar, '===' + ResultCode.NO_MATCH + '?', indexVar, ':', baseTakerResultVar,
    ';',
  ];

  return compileInternalTaker<AllGenericTaker>(InternalTakerType.ALL_GENERIC, factory, isTakerCodegen(baseTaker) ? baseTaker.bindings : [[baseTakerVar, baseTaker]]);
}
