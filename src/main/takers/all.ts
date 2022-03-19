import {CharCodeChecker, ResultCode, Taker} from '../taker-types';
import {isTaker} from '../taker-utils';
import {CharTaker} from './char';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';
import {none} from './none';
import {never} from './never';
import {createMaybeTaker} from './maybe';
import {RegexTaker} from './regex';
import {TakerType} from './TakerType';

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
  if (
      taker === never
      || taker === none
      || isTaker<AllCharTaker>(taker, TakerType.AllCharTaker)
      || isTaker<AllCaseSensitiveTextTaker>(taker, TakerType.AllCaseSensitiveTextTaker)
      || isTaker<AllTaker>(taker, TakerType.AllTaker)
  ) {
    return taker;
  }
  if (isTaker<CharTaker>(taker, TakerType.CharTaker)) {
    return createAllCharTaker(taker.__charCodeChecker, minimumCount, maximumCount);
  }
  if (isTaker<CaseSensitiveCharTaker>(taker, TakerType.CaseSensitiveCharTaker)) {
    return createAllCaseSensitiveTextTaker(taker.__char, minimumCount, maximumCount);
  }
  if (isTaker<CaseSensitiveTextTaker>(taker, TakerType.CaseSensitiveTextTaker)) {
    return createAllCaseSensitiveTextTaker(taker.__str, minimumCount, maximumCount);
  }
  if (isTaker<RegexTaker>(taker, TakerType.RegexTaker)) {
    return createAllRegexTaker(taker.__re, minimumCount, maximumCount);
  }
  return createAllTaker(taker, minimumCount, maximumCount);
}

export interface AllCharTaker extends Taker {
  __type: TakerType.AllCharTaker;
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

  take.__type = TakerType.AllCharTaker;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;


  return take;
}

export interface AllCaseSensitiveTextTaker extends Taker {
  __type: TakerType.AllCaseSensitiveTextTaker;
  __minimumCount: number;
  __maximumCount: number;
}

export function createAllCaseSensitiveTextTaker(str: string, minimumCount: number, maximumCount: number): AllCaseSensitiveTextTaker {

  const take: AllCaseSensitiveTextTaker = (input, offset) => {
    const strLength = str.length;

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

  take.__type = TakerType.AllCaseSensitiveTextTaker;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}

export interface AllRegexTaker extends Taker {
  __type: TakerType.AllRegexTaker;
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

  take.__type = TakerType.AllRegexTaker;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}

export interface AllTaker extends Taker {
  __type: TakerType.AllTaker;
  __minimumCount: number;
  __maximumCount: number;
}

export function createAllTaker(taker: Taker, minimumCount: number, maximumCount: number): AllTaker {

  const take: AllTaker = (input, offset) => {
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

  take.__type = TakerType.AllTaker;
  take.__minimumCount = minimumCount;
  take.__maximumCount = maximumCount;

  return take;
}
