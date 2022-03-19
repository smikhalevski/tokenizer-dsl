import {CharTaker} from './char';
import {createMaybeTaker} from './maybe';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {CharCodeChecker, ResultCode, Taker, TakerType} from './taker-types';
import {isTaker} from './taker-utils';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';

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
export function all(taker: Taker, options: AllOptions = {}): Taker {

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
    return taker;
  }
  if (taker === never || taker === none || isAllTaker(taker)) {
    return taker;
  }
  if (isTaker<CharTaker>(taker, TakerType.CHAR)) {
    return createAllCharTaker(taker.__charCodeChecker, minimumCount, maximumCount);
  }
  if (isTaker<CaseSensitiveCharTaker>(taker, TakerType.CASE_SENSITIVE_CHAR)) {
    return createAllCaseSensitiveTextTaker(taker.__char, minimumCount, maximumCount);
  }
  if (isTaker<CaseSensitiveTextTaker>(taker, TakerType.CASE_SENSITIVE_TEXT)) {
    return createAllCaseSensitiveTextTaker(taker.__str, minimumCount, maximumCount);
  }
  if (isTaker<RegexTaker>(taker, TakerType.REGEX)) {
    return createAllRegexTaker(taker.__re, minimumCount, maximumCount);
  }
  return createAllGenericTaker(taker, minimumCount, maximumCount);
}

export type AllTaker =
    | AllCharTaker
    | AllCaseSensitiveTextTaker
    | AllRegexTaker
    | AllGenericTaker;

export function isAllTaker(taker: Taker): taker is AllTaker {
  return isTaker<AllCharTaker>(taker, TakerType.ALL_CHAR)
      || isTaker<AllCaseSensitiveTextTaker>(taker, TakerType.ALL_CASE_SENSITIVE_TEXT)
      || isTaker<AllRegexTaker>(taker, TakerType.ALL_REGEX)
      || isTaker<AllGenericTaker>(taker, TakerType.ALL_GENERIC);
}

export interface AllCharTaker extends Taker {
  __type: TakerType.ALL_CHAR;
  __minimumCount: number;
  __maximumCount: number;
}

export function createAllCharTaker(charCodeChecker: CharCodeChecker, minimumCount: number, maximumCount: number): AllCharTaker {

  const take: AllCharTaker = (input, offset) => {
    const inputLength = input.length;

    let takeCount = 0;
    let i = offset;

    while (i < inputLength && takeCount < maximumCount && charCodeChecker(input.charCodeAt(i))) {
      ++takeCount;
      ++i;
    }
    if (takeCount < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  };

  take.__type = TakerType.ALL_CHAR;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}

export interface AllCaseSensitiveTextTaker extends Taker {
  __type: TakerType.ALL_CASE_SENSITIVE_TEXT;
  __minimumCount: number;
  __maximumCount: number;
}

export function createAllCaseSensitiveTextTaker(str: string, minimumCount: number, maximumCount: number): AllCaseSensitiveTextTaker {

  const strLength = str.length;

  const take: AllCaseSensitiveTextTaker = (input, offset) => {
    let takeCount = 0;
    let i = offset;

    while (takeCount < maximumCount && input.startsWith(str, i)) {
      ++takeCount;
      i += strLength;
    }
    if (takeCount < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  };

  take.__type = TakerType.ALL_CASE_SENSITIVE_TEXT;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}

export interface AllRegexTaker extends Taker {
  __type: TakerType.ALL_REGEX;
  __minimumCount: number;
  __maximumCount: number;
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
      re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g')
  );

  const take: AllRegexTaker = (input, offset) => {
    re.lastIndex = offset;

    const result = re.exec(input);

    return result === null || result.index !== offset ? ResultCode.NO_MATCH : re.lastIndex;
  };

  take.__type = TakerType.ALL_REGEX;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}

export interface AllGenericTaker extends Taker {
  __type: TakerType.ALL_GENERIC;
  __minimumCount: number;
  __maximumCount: number;
}

export function createAllGenericTaker(taker: Taker, minimumCount: number, maximumCount: number): AllGenericTaker {

  const take: AllGenericTaker = (input, offset) => {
    let takeCount = 0;
    let result = offset;
    let i;

    do {
      i = result;
      result = taker(input, i);
    } while (result > i && ++takeCount < maximumCount);

    if (takeCount < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    if (result === ResultCode.NO_MATCH) {
      return i;
    }
    return result;
  };

  take.__type = TakerType.ALL_GENERIC;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}
