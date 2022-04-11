import {Binding, createVar, Var} from '../code';
import {CHAR_CODE_RANGE_TYPE, CharCodeRangeTaker, createCharCodePredicate} from './char';
import {MaybeTaker} from './maybe';
import {never} from './never';
import {none} from './none';
import {REGEX_TYPE, RegexTaker} from './regex';
import {CharCodeRange, InternalTaker, NO_MATCH, CodeBindings, Taker} from './taker-types';
import {createCodeBindings, createTakerType, createTakerCall, isInternalTaker, toCharCodes} from './taker-utils';
import {CASE_SENSITIVE_TEXT_TYPE, CaseSensitiveTextTaker} from './text';

export const ALL_CHAR_CODE_RANGE_TYPE = createTakerType();
export const ALL_CASE_SENSITIVE_TEXT_TYPE = createTakerType();
export const ALL_REGEX_TYPE = createTakerType();
export const ALL_GENERIC_TYPE = createTakerType();

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
  maximumCount = Math.max(maximumCount | 0, 0); // 0 = Infinity

  if (maximumCount > 0 && minimumCount > maximumCount) {
    return never;
  }
  if (minimumCount === 0 && maximumCount === 1) {
    return new MaybeTaker(taker);
  }
  if (minimumCount === 1 && maximumCount === 1) {
    return taker;
  }
  if (taker === never || taker === none) {
    return taker;
  }
  if (isInternalTaker<CharCodeRangeTaker>(CHAR_CODE_RANGE_TYPE, taker)) {
    return new AllCharCodeRangeTaker(taker.charCodeRanges, minimumCount, maximumCount);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(CASE_SENSITIVE_TEXT_TYPE, taker)) {
    return new AllCaseSensitiveTextTaker(taker.str, minimumCount, maximumCount);
  }
  if (isInternalTaker<RegexTaker>(REGEX_TYPE, taker)) {
    return new AllRegexTaker(taker.re, minimumCount, maximumCount);
  }
  return new AllGenericTaker(taker, minimumCount, maximumCount);
}

export class AllCharCodeRangeTaker implements InternalTaker {

  readonly type = ALL_CHAR_CODE_RANGE_TYPE;

  constructor(public charCodeRanges: CharCodeRange[], public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {charCodeRanges, minimumCount, maximumCount} = this;

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const charCodeVar = createVar();
    const takeCountVar = createVar();

    return createCodeBindings([
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
      createCharCodePredicate(charCodeVar, charCodeRanges),
      ')){',
      minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
      '++', indexVar,
      '}',
      resultVar, '=',
      minimumCount ? [takeCountVar, '<', minimumCount, '?', NO_MATCH, ':', indexVar] : indexVar,
      ';'
    ]);
  }
}

export class AllCaseSensitiveTextTaker implements InternalTaker {

  readonly type = ALL_CASE_SENSITIVE_TEXT_TYPE;

  constructor(public str: string, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {str, minimumCount, maximumCount} = this;

    const strVar = createVar();
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takeCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
          ';',
          'while(',
          indexVar, '+', str.length, '<=', inputLengthVar,
          maximumCount ? ['&&', takeCountVar, '<', maximumCount] : '',
          toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', indexVar, '+', i, ')===', charCode]),
          '){',
          minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
          indexVar, '+=', str.length,
          '}',
          resultVar, '=',
          minimumCount ? [takeCountVar, '<', minimumCount, '?', NO_MATCH, ':', indexVar] : indexVar,
          ';',
        ],
        [[strVar, str]],
    );
  }
}

export class AllRegexTaker implements InternalTaker {

  readonly type = ALL_REGEX_TYPE;
  re;

  constructor(re: RegExp, minimumCount: number, maximumCount: number) {
    this.re = RegExp(
        '(?:'
        + re.source
        + '){'
        + minimumCount
        + ','
        + (maximumCount || '')
        + '}',
        re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'),
    );
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {

    const reVar = createVar();
    const arrVar = createVar();

    return createCodeBindings(
        [
          reVar, '.lastIndex=', offsetVar, ';',
          'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
          resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?', NO_MATCH, ':', reVar, '.lastIndex;',
        ],
        [[reVar, this.re]],
    );
  }
}

export class AllGenericTaker implements InternalTaker {

  readonly type = ALL_GENERIC_TYPE;

  constructor(public taker: Taker, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {taker, minimumCount, maximumCount} = this;

    const bindings: Binding[] = [];
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takerResultVar = createVar();
    const takeCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, ',',
          takerResultVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
          ';',
          'do{',
          indexVar, '=', takerResultVar, ';',
          createTakerCall(taker, inputVar, indexVar, takerResultVar, bindings),
          '}while(',
          takerResultVar, '>', indexVar,
          minimumCount || maximumCount ? ['&&++', takeCountVar, maximumCount ? '<' + maximumCount : ''] : '',
          ')',
          resultVar, '=',
          minimumCount ? [takeCountVar, '<', minimumCount, '?', NO_MATCH, ':'] : '',
          takerResultVar, '===', NO_MATCH, '?', indexVar, ':', takerResultVar,
          ';',
        ],
        bindings,
    );
  }
}
