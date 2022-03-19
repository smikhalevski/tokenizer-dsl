import {CharCodeChecker, ResultCode, Taker} from '../taker-types';
import {CharTaker} from './char';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';
import {isTaker} from '../taker-utils';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {TakerType} from './TakerType';

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
export function until(taker: Taker, options: UntilOptions = {}): Taker {

  const {
    inclusive = false,
    openEnded = false,
    endOffset = 0,
  } = options;

  if (
      taker === never
      || taker === none
      || isTaker<UntilRegexTaker>(taker, TakerType.UntilRegexTaker)
      || isTaker<UntilCaseSensitiveTextTaker>(taker, TakerType.UntilCaseSensitiveTextTaker)
      || isTaker<UntilCharTaker>(taker, TakerType.UntilCharTaker)
      || isTaker<UntilTaker>(taker, TakerType.UntilTaker)
  ) {
    return taker;
  }
  if (isTaker<RegexTaker>(taker, TakerType.RegexTaker)) {
    return createUntilRegexTaker(taker.__re, inclusive, openEnded, endOffset);
  }
  if (isTaker<CaseSensitiveCharTaker>(taker, TakerType.CaseSensitiveCharTaker)) {
    return createUntilCaseSensitiveTextTaker(taker.__char, inclusive, openEnded, endOffset);
  }
  if (isTaker<CaseSensitiveTextTaker>(taker, TakerType.CaseSensitiveTextTaker)) {
    return createUntilCaseSensitiveTextTaker(taker.__str, inclusive, openEnded, endOffset);
  }
  if (isTaker<CharTaker>(taker, TakerType.CharTaker)) {
    return createUntilCharTaker(taker.__charCodeChecker, inclusive, openEnded, endOffset);
  }
  return createUntilTaker(taker, inclusive, openEnded, endOffset);
}

export interface UntilCaseSensitiveTextTaker extends Taker {
  __type: TakerType.UntilCaseSensitiveTextTaker;
}

export function createUntilCaseSensitiveTextTaker(str: string, inclusive: boolean, openEnded: boolean, endOffset: number): UntilCaseSensitiveTextTaker {

  const takenOffset = inclusive ? str.length : 0;

  const take: UntilCaseSensitiveTextTaker = (input, offset) => {
    const index = input.indexOf(str, offset);

    if (index === -1) {
      return openEnded ? input.length + endOffset : ResultCode.NO_MATCH;
    }
    return index + takenOffset;
  };

  take.__type = TakerType.UntilCaseSensitiveTextTaker;

  return take;
}

export interface UntilCharTaker extends Taker {
  __type: TakerType.UntilCharTaker;
}

export function createUntilCharTaker(charCodeChecker: CharCodeChecker, inclusive: boolean, openEnded: boolean, endOffset: number): UntilCharTaker {

  const takenOffset = inclusive ? 1 : 0;

  const take: UntilCharTaker = (input, offset) => {
    const inputLength = input.length;

    let i = offset;
    while (i < inputLength && !charCodeChecker(input.charCodeAt(i))) {
      ++i;
    }
    if (i === inputLength) {
      return openEnded ? inputLength + endOffset : ResultCode.NO_MATCH;
    }
    return i + takenOffset;
  };

  take.__type = TakerType.UntilCharTaker;

  return take;
}

export interface UntilRegexTaker extends Taker {
  __type: TakerType.UntilRegexTaker;
}

export function createUntilRegexTaker(re: RegExp, inclusive: boolean, openEnded: boolean, endOffset: number): UntilRegexTaker {

  re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');

  const take: UntilRegexTaker = (input, offset) => {
    re.lastIndex = offset;

    const result = re.exec(input);

    if (result === null) {
      return openEnded ? input.length + endOffset : ResultCode.NO_MATCH;
    }

    return inclusive ? re.lastIndex : result.index;
  };

  take.__type = TakerType.UntilRegexTaker;

  return take;
}

export interface UntilTaker extends Taker {
  __type: TakerType.UntilTaker;
}

export function createUntilTaker(taker: Taker, inclusive: boolean, openEnded: boolean, endOffset: number): UntilTaker {

  const take: UntilTaker = (input, offset) => {
    const inputLength = input.length;

    let result = ResultCode.NO_MATCH;
    let i = offset;

    while (i < inputLength && result === ResultCode.NO_MATCH) {
      result = taker(input, i);
      ++i;
    }

    if (result === ResultCode.NO_MATCH) {
      return openEnded ? inputLength + endOffset : result;
    }
    if (result < 0) {
      return result;
    }
    return inclusive ? result : i - 1;
  };

  take.__type = TakerType.UntilTaker;

  return take;
}
