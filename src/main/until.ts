import {CharTaker} from './char';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {CharCodeChecker, ResultCode, Taker, TakerType} from './taker-types';
import {isTaker} from './taker-utils';
import {CaseSensitiveCharTaker, CaseSensitiveTextTaker} from './text';

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

  if (taker === never || taker === none || isUntilTaker(taker)) {
    return taker;
  }
  if (isTaker<RegexTaker>(taker, TakerType.REGEX)) {
    return createUntilRegexTaker(taker.__re, inclusive, openEnded, endOffset);
  }
  if (isTaker<CaseSensitiveCharTaker>(taker, TakerType.CASE_SENSITIVE_CHAR)) {
    return createUntilCaseSensitiveTextTaker(taker.__char, inclusive, openEnded, endOffset);
  }
  if (isTaker<CaseSensitiveTextTaker>(taker, TakerType.CASE_SENSITIVE_TEXT)) {
    return createUntilCaseSensitiveTextTaker(taker.__str, inclusive, openEnded, endOffset);
  }
  if (isTaker<CharTaker>(taker, TakerType.CHAR)) {
    return createUntilCharTaker(taker.__charCodeChecker, inclusive, openEnded, endOffset);
  }
  return createUntilGenericTaker(taker, inclusive, openEnded, endOffset);
}

export type UntilTaker =
    | UntilRegexTaker
    | UntilCaseSensitiveTextTaker
    | UntilCharTaker
    | UntilGenericTaker;

export function isUntilTaker(taker: Taker): taker is UntilTaker {
  return isTaker<UntilRegexTaker>(taker, TakerType.UNTIL_REGEX)
      || isTaker<UntilCaseSensitiveTextTaker>(taker, TakerType.UNTIL_CASE_SENSITIVE_TEXT)
      || isTaker<UntilCharTaker>(taker, TakerType.UNTIL_CHAR)
      || isTaker<UntilGenericTaker>(taker, TakerType.UNTIL_GENERIC);
}

export interface UntilCaseSensitiveTextTaker extends Taker {
  __type: TakerType.UNTIL_CASE_SENSITIVE_TEXT;
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

  take.__type = TakerType.UNTIL_CASE_SENSITIVE_TEXT;

  return take;
}

export interface UntilCharTaker extends Taker {
  __type: TakerType.UNTIL_CHAR;
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

  take.__type = TakerType.UNTIL_CHAR;

  return take;
}

export interface UntilRegexTaker extends Taker {
  __type: TakerType.UNTIL_REGEX;
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

  take.__type = TakerType.UNTIL_REGEX;

  return take;
}

export interface UntilGenericTaker extends Taker {
  __type: TakerType.UNTIL_GENERIC;
}

export function createUntilGenericTaker(taker: Taker, inclusive: boolean, openEnded: boolean, endOffset: number): UntilGenericTaker {

  const take: UntilGenericTaker = (input, offset) => {
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

  take.__type = TakerType.UNTIL_GENERIC;

  return take;
}
