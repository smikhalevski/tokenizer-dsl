import {CharCodeChecker, ITaker, ResultCode, TakerLike} from '../taker-types';
import {neverTaker, noneTaker, toTaker} from '../taker-utils';
import {CharTaker} from './char';

export interface IAllOptions {

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
export function all(taker: TakerLike, options: IAllOptions = {}): ITaker {
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
    return new AllCharTaker(taker._charCodeChecker, minimumCount, maximumCount);
  }
  return new AllTaker(taker, minimumCount, maximumCount);
}

export class AllCharTaker implements ITaker {

  private _charCodeChecker;
  private _minimumCount;
  private _maximumCount;

  public constructor(charCodeChecker: CharCodeChecker, minimumCount: number, maximumCount: number) {
    this._charCodeChecker = charCodeChecker;
    this._minimumCount = minimumCount;
    this._maximumCount = maximumCount;
  }

  public take(input: string, offset: number): number {
    const charCodeChecker = this._charCodeChecker;
    const maximumOffset = offset + this._maximumCount;

    let i = offset;
    while (i < maximumOffset && charCodeChecker(input.charCodeAt(i))) {
      ++i;
    }
    if (i - offset < this._minimumCount) {
      return ResultCode.NO_MATCH;
    }
    return i;
  }
}

export class AllTaker implements ITaker {

  private _taker;
  private _minimumCount;
  private _maximumCount;

  public constructor(taker: ITaker, minimumCount: number, maximumCount: number) {
    this._taker = taker;
    this._minimumCount = minimumCount;
    this._maximumCount = maximumCount;
  }

  public take(input: string, offset: number): number {
    const taker = this._taker;
    const maximumCount = this._maximumCount;
    const minimumCount = this._minimumCount;

    let takeCount = 0;
    let result = offset;
    let i;

    do {
      i = result;
      result = taker.take(input, i);
    } while (result > i && ++takeCount < maximumCount);

    if (takeCount < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    if (result === ResultCode.NO_MATCH) {
      return i;
    }
    return result;
  }
}
