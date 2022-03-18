import {CharCodeChecker, Taker, ResultCode, TakerLike} from '../taker-types';
import {CharTaker} from './char';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';
import {toTaker} from '../taker-utils';

export interface UntilOptions {

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
export function until(taker: TakerLike, options: UntilOptions = {}): Taker {
  taker = toTaker(taker);

  const {
    inclusive = false,
    openEnded = false,
    endOffset = 0,
  } = options;

  if (taker instanceof CaseSensitiveCharTaker) {
    return new UntilCaseSensitiveTextTaker(taker.__char, openEnded, endOffset, inclusive);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new UntilCaseSensitiveTextTaker(taker.__str, openEnded, endOffset, inclusive);
  }
  if (taker instanceof CharTaker) {
    return new UntilCharTaker(taker.__charCodeChecker, openEnded, endOffset, inclusive);
  }
  return new UntilTaker(taker, openEnded, endOffset, inclusive);
}

export class UntilCaseSensitiveTextTaker implements Taker {

  private readonly __str;
  private readonly __openEnded;
  private readonly __endOffset;
  private readonly __takenOffset;

  public constructor(str: string, openEnded: boolean, endOffset: number, inclusive: boolean) {
    this.__str = str;
    this.__openEnded = openEnded;
    this.__endOffset = endOffset;
    this.__takenOffset = inclusive ? str.length : 0;
  }

  public take(input: string, offset: number): number {

    const {
      __str,
      __openEnded,
      __endOffset,
      __takenOffset,
    } = this;

    const index = input.indexOf(__str, offset);

    if (index === -1) {
      return __openEnded ? input.length + __endOffset : ResultCode.NO_MATCH;
    }
    return index + __takenOffset;
  }
}

export class UntilCharTaker implements Taker {

  private readonly __charCodeChecker;
  private readonly __openEnded;
  private readonly __endOffset;
  private readonly __takenOffset;

  public constructor(charCodeChecker: CharCodeChecker, openEnded: boolean, endOffset: number, inclusive: boolean) {
    this.__charCodeChecker = charCodeChecker;
    this.__openEnded = openEnded;
    this.__endOffset = endOffset;
    this.__takenOffset = inclusive ? 1 : 0;
  }

  public take(input: string, offset: number): number {

    const {
      __charCodeChecker,
      __openEnded,
      __endOffset,
      __takenOffset,
    } = this;

    const inputLength = input.length;

    let i = offset;
    while (i < inputLength && !__charCodeChecker(input.charCodeAt(i))) {
      ++i;
    }
    if (i === inputLength) {
      return __openEnded ? inputLength + __endOffset : ResultCode.NO_MATCH;
    }
    return i + __takenOffset;
  }
}

export class UntilTaker implements Taker {

  private readonly __taker;
  private readonly __openEnded;
  private readonly __endOffset;
  private readonly __inclusive;

  public constructor(taker: Taker, openEnded: boolean, endOffset: number, inclusive: boolean) {
    this.__taker = taker;
    this.__openEnded = openEnded;
    this.__endOffset = endOffset;
    this.__inclusive = inclusive;
  }

  public take(input: string, offset: number): number {

    const {
      __taker,
      __openEnded,
      __endOffset,
      __inclusive,
    } = this;

    const inputLength = input.length;

    let result = ResultCode.NO_MATCH;
    let i = offset;

    while (i < inputLength && result === ResultCode.NO_MATCH) {
      result = __taker.take(input, i);
      ++i;
    }

    if (result === ResultCode.NO_MATCH) {
      return __openEnded ? inputLength + __endOffset : result;
    }
    if (result < 0) {
      return result;
    }
    return __inclusive ? result : i - 1;
  }
}
