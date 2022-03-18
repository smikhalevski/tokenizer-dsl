import {CharCodeChecker, Taker, ResultCode, TakerLike} from '../taker-types';
import {neverTaker, noneTaker, toTaker} from '../taker-utils';
import {CharTaker} from './char';
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
  taker = toTaker(taker);

  const {
    minimumCount = 0,
    maximumCount = Infinity,
  } = options;

  if (minimumCount > maximumCount || maximumCount < 0) {
    return neverTaker;
  }
  if (maximumCount === 0) {
    return noneTaker;
  }
  if (maximumCount === 1) {
    return taker;
  }
  if (taker instanceof CharTaker) {
    return new AllCharTaker(taker.__charCodeChecker, minimumCount, maximumCount);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new AllCaseSensitiveTextTaker(taker.__str, minimumCount, maximumCount);
  }
  return new AllTaker(taker, minimumCount, maximumCount);
}

/**
 * Takes all chars using a checker callback.
 */
export class AllCharTaker implements Taker {

  private readonly __charCodeChecker;
  private readonly __minimumCount;
  private readonly __maximumCount;

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

    let takeCount = 0;
    let i = offset;

    while (takeCount < __maximumCount && __charCodeChecker(input.charCodeAt(i))) {
      ++takeCount;
      ++i;
    }
    if (takeCount < __minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  }
}

/**
 * Takes all sequential matches of a case-sensitive string.
 */
export class AllCaseSensitiveTextTaker implements Taker {

  private readonly __str;
  private readonly __minimumCount;
  private readonly __maximumCount;

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

/**
 * Takes all sequential matches of another taker.
 */
export class AllTaker implements Taker {

  private readonly __taker;
  private readonly __minimumCount;
  private readonly __maximumCount;

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
