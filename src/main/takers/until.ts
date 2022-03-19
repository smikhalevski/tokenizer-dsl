import {CharCodeChecker, ResultCode, Taker, TakerLike} from '../taker-types';
import {CharTaker} from './char';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';
import {toTaker} from '../toTaker';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';

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

  if (taker === never || taker === none || taker instanceof UntilRegexTaker || taker instanceof UntilCaseSensitiveTextTaker || taker instanceof UntilCharTaker || taker instanceof UntilTaker) {
    return taker;
  }
  if (taker instanceof RegexTaker) {
    return new UntilRegexTaker(taker.__re, inclusive, openEnded, endOffset);
  }
  if (taker instanceof CaseSensitiveCharTaker) {
    return new UntilCaseSensitiveTextTaker(taker.__char, inclusive, openEnded, endOffset);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new UntilCaseSensitiveTextTaker(taker.__str, inclusive, openEnded, endOffset);
  }
  if (taker instanceof CharTaker) {
    return new UntilCharTaker(taker.__charCodeChecker, inclusive, openEnded, endOffset);
  }
  return new UntilTaker(taker, inclusive, openEnded, endOffset);
}

export class UntilCaseSensitiveTextTaker implements Taker {

  public readonly __str;
  public readonly __openEnded;
  public readonly __endOffset;
  public readonly __takenOffset;

  public constructor(str: string, inclusive: boolean, openEnded: boolean, endOffset: number) {
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

  public readonly __charCodeChecker;
  public readonly __openEnded;
  public readonly __endOffset;
  public readonly __takenOffset;

  public constructor(charCodeChecker: CharCodeChecker, inclusive: boolean, openEnded: boolean, endOffset: number) {
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

export class UntilRegexTaker implements Taker {

  public readonly __re;
  public readonly __inclusive;
  public readonly __openEnded;
  public readonly __endOffset;

  public constructor(re: RegExp, inclusive: boolean, openEnded: boolean, endOffset: number) {
    this.__re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');
    this.__inclusive = inclusive;
    this.__openEnded = openEnded;
    this.__endOffset = endOffset;
  }

  public take(input: string, offset: number): number {

    const {
      __re,
      __openEnded,
      __endOffset,
      __inclusive,
    } = this;

    __re.lastIndex = offset;

    const result = __re.exec(input);

    if (result === null) {
      return __openEnded ? input.length + __endOffset : ResultCode.NO_MATCH;
    }

    return __inclusive ? __re.lastIndex : result.index;
  }
}

export class UntilTaker implements Taker {

  public readonly __taker;
  public readonly __inclusive;
  public readonly __openEnded;
  public readonly __endOffset;

  public constructor(taker: Taker, inclusive: boolean, openEnded: boolean, endOffset: number) {
    this.__taker = taker;
    this.__inclusive = inclusive;
    this.__openEnded = openEnded;
    this.__endOffset = endOffset;
  }

  public take(input: string, offset: number): number {

    const {
      __taker,
      __inclusive,
      __openEnded,
      __endOffset,
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
