import {CharCodeChecker, ITaker, ResultCode, TakerLike} from '../taker-types';
import {CharTaker} from './char';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';
import {toTaker} from '../taker-utils';

export interface IUntilOptions {

  /**
   * If set to `true` then chars matched by `taker` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;

  openEnded?: boolean;

  endOffset?: number;
}

/**
 * Creates taker that takes chars until `taker` matches.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function until(taker: TakerLike, options: IUntilOptions = {}): ITaker {
  taker = toTaker(taker);

  const {
    inclusive = false,
    openEnded = false,
    endOffset = 0,
  } = options;

  if (taker instanceof CaseSensitiveCharTaker) {
    return new UntilCaseSensitiveTextTaker(taker._char, openEnded, endOffset, inclusive);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new UntilCaseSensitiveTextTaker(taker._str, openEnded, endOffset, inclusive);
  }
  if (taker instanceof CharTaker) {
    return new UntilCharTaker(taker._charCodeChecker, openEnded, endOffset, inclusive);
  }
  return new UntilTaker(taker, openEnded, endOffset, inclusive);
}

export class UntilCaseSensitiveTextTaker implements ITaker {

  private _str;
  private _openEnded;
  private _endOffset;
  private _takenOffset;

  public constructor(str: string, openEnded: boolean, endOffset: number, inclusive: boolean) {
    this._str = str;
    this._openEnded = openEnded;
    this._endOffset = endOffset;
    this._takenOffset = inclusive ? str.length : 0;
  }

  public take(input: string, offset: number): number {
    const openEnded = this._openEnded;
    const endOffset = this._endOffset;
    const takenOffset = this._takenOffset;

    const index = input.indexOf(this._str, offset);

    if (index === -1) {
      return openEnded ? input.length + endOffset : ResultCode.NO_MATCH;
    }
    return index + takenOffset;
  }
}

export class UntilCharTaker implements ITaker {

  private _charCodeChecker;
  private _openEnded;
  private _endOffset;
  private _takenOffset;

  public constructor(charCodeChecker: CharCodeChecker, openEnded: boolean, endOffset: number, inclusive: boolean) {
    this._charCodeChecker = charCodeChecker;
    this._openEnded = openEnded;
    this._endOffset = endOffset;
    this._takenOffset = inclusive ? 1 : 0;
  }

  public take(input: string, offset: number): number {
    const charCodeChecker = this._charCodeChecker;
    const openEnded = this._openEnded;
    const endOffset = this._endOffset;
    const takenOffset = this._takenOffset;

    const inputLength = input.length;

    let i = offset;
    while (i < inputLength && !charCodeChecker(input.charCodeAt(i))) {
      ++i;
    }
    if (i === inputLength) {
      return openEnded ? inputLength + endOffset : ResultCode.NO_MATCH;
    }
    return i + takenOffset;
  }
}

export class UntilTaker implements ITaker {

  private _taker;
  private _openEnded;
  private _endOffset;
  private _inclusive;

  public constructor(taker: ITaker, openEnded: boolean, endOffset: number, inclusive: boolean) {
    this._taker = taker;
    this._openEnded = openEnded;
    this._endOffset = endOffset;
    this._inclusive = inclusive;
  }

  public take(input: string, offset: number): number {
    const taker = this._taker;
    const openEnded = this._openEnded;
    const endOffset = this._endOffset;
    const inclusive = this._inclusive;

    const inputLength = input.length;

    let result = ResultCode.NO_MATCH;
    let i = offset;

    while (i < inputLength && result === ResultCode.NO_MATCH) {
      result = taker.take(input, i);
      ++i;
    }

    if (result === ResultCode.NO_MATCH) {
      return openEnded ? inputLength + endOffset : result;
    }
    if (result < 0) {
      return result;
    }
    return inclusive ? result : i - 1;
  }
}
