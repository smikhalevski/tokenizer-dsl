import {CharCodeChecker, ResultCode, Taker, TakerLike} from '../taker-types';
import {toTaker} from '../toTaker';
import {CharTaker} from './char';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';
import {none} from './none';
import {never} from './never';
import {MaybeTaker} from './maybe';

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
  taker = toTaker(taker);

  const {
    minimumCount = 0,
    maximumCount = Infinity,
  } = options;

  if (minimumCount > maximumCount || maximumCount < 0) {
    return never;
  }
  if (maximumCount === 0) {
    return none;
  }
  if (maximumCount === 1 && minimumCount <= 0) {
    return new MaybeTaker(taker);
  }
  if (maximumCount === 1 && minimumCount === 1) {
    return taker;
  }
  if (taker instanceof AllCharTaker || taker instanceof AllCaseSensitiveTextTaker || taker instanceof AllTaker) {
    return taker;
  }
  if (taker instanceof CharTaker) {
    return new AllCharTaker(taker.__charCodeChecker, minimumCount, maximumCount);
  }
  if (taker instanceof CaseSensitiveCharTaker) {
    return new AllCaseSensitiveTextTaker(taker.__char, minimumCount, maximumCount);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new AllCaseSensitiveTextTaker(taker.__str, minimumCount, maximumCount);
  }
  return new AllTaker(taker, minimumCount, maximumCount);
}

export class AllCharTaker implements Taker {

  public readonly __charCodeChecker;
  public readonly __minimumCount;
  public readonly __maximumCount;

  public constructor(charCodeChecker: CharCodeChecker, minimumCount: number, maximumCount: number) {
    this.__charCodeChecker = charCodeChecker;
    this.__minimumCount = minimumCount;
    this.__maximumCount = maximumCount;
  }

  public take(input: string, offset: number): number {

    const {
      __charCodeChecker,
      __minimumCount,
      __maximumCount,
    } = this;

    const inputLength = input.length;

    let takeCount = 0;
    let i = offset;

    while (i < inputLength && takeCount < __maximumCount && __charCodeChecker(input.charCodeAt(i))) {
      ++takeCount;
      ++i;
    }
    if (takeCount < __minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  }
}

export class AllCaseSensitiveTextTaker implements Taker {

  public readonly __str;
  public readonly __minimumCount;
  public readonly __maximumCount;

  public constructor(str: string, minimumCount: number, maximumCount: number) {
    this.__str = str;
    this.__minimumCount = minimumCount;
    this.__maximumCount = maximumCount;
  }

  public take(input: string, offset: number): number {

    const {
      __str,
      __minimumCount,
      __maximumCount,
    } = this;

    const strLength = __str.length;

    let takeCount = 0;
    let i = offset;

    while (takeCount < __maximumCount && input.startsWith(__str, i)) {
      ++takeCount;
      i += strLength;
    }
    if (takeCount < __minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  }
}

export class AllTaker implements Taker {

  public readonly __taker;
  public readonly __minimumCount;
  public readonly __maximumCount;

  public constructor(taker: Taker, minimumCount: number, maximumCount: number) {
    this.__taker = taker;
    this.__minimumCount = minimumCount;
    this.__maximumCount = maximumCount;
  }

  public take(input: string, offset: number): number {

    const {
      __taker,
      __maximumCount,
      __minimumCount,
    } = this;

    let takeCount = 0;
    let result = offset;
    let i;

    do {
      i = result;
      result = __taker.take(input, i);
    } while (result > i && ++takeCount < __maximumCount);

    if (takeCount < __minimumCount) {
      return ResultCode.NO_MATCH;
    }
    if (result === ResultCode.NO_MATCH) {
      return i;
    }
    return result;
  }
}
