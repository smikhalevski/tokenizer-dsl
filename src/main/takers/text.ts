import {ResultCode, Taker} from '../taker-types';
import {none} from './none';
import {TakerType} from './TakerType';

export interface TextOptions {

  /**
   * If set to `true` then string comparison is case-insensitive.
   *
   * @default false
   */
  caseInsensitive?: boolean;

  /**
   * Locale that is used to match case-insensitive strings.
   */
  locales?: string | string[];
}

/**
 * Creates taker that reads a substring from the input.
 *
 * @param str The text to match.
 * @param options Taker options.
 * @see {@link char}
 */
export function text(str: string, options: TextOptions = {}): Taker {
  const {
    caseInsensitive = false,
    locales,
  } = options;

  const strLength = str.length;

  if (strLength === 0) {
    return none;
  }
  if (caseInsensitive && toLowerCase(str, locales) !== toUpperCase(str, locales)) {
    if (strLength === 1) {
      return createCaseInsensitiveCharTaker(str, locales);
    }
    return createCaseInsensitiveTextTaker(str, locales);
  }
  if (strLength === 1) {
    return createCaseSensitiveCharTaker(str);
  }
  return createCaseSensitiveTextTaker(str);
}

export interface CaseSensitiveCharTaker extends Taker {
  __type: TakerType.CaseSensitiveCharTaker;
  __char: string;
}

export function createCaseSensitiveCharTaker(char: string): CaseSensitiveCharTaker {

  const charCode = char.charCodeAt(0);

  const take: CaseSensitiveCharTaker = (input, offset) => {
    return input.charCodeAt(offset) === charCode ? offset + 1 : ResultCode.NO_MATCH;
  };

  take.__type = TakerType.CaseSensitiveCharTaker;
  take.__char = char;

  return take;
}

export interface CaseInsensitiveCharTaker extends Taker {
  __type: TakerType.CaseInsensitiveCharTaker;
  __char: string;
  __locales: string | string[] | undefined;
}

export function createCaseInsensitiveCharTaker(char: string, locales: string | string[] | undefined): CaseInsensitiveCharTaker {

  const lowerCharCode = toLowerCase(char, locales).charCodeAt(0);
  const upperCharCode = toUpperCase(char, locales).charCodeAt(0);

  const take: CaseInsensitiveCharTaker = (input, offset) => {
    const charCode = input.charCodeAt(offset);
    return charCode === lowerCharCode || charCode === upperCharCode ? offset + 1 : ResultCode.NO_MATCH;
  };

  take.__type = TakerType.CaseInsensitiveCharTaker;
  take.__char = char;
  take.__locales = locales;

  return take;
}

export interface CaseSensitiveTextTaker extends Taker {
  __type: TakerType.CaseSensitiveTextTaker;
  __str: string;
}

export function createCaseSensitiveTextTaker(str: string): CaseSensitiveTextTaker {

  const take: CaseSensitiveTextTaker = (input, offset) => {
    return input.startsWith(str, offset) ? offset + str.length : ResultCode.NO_MATCH;
  };

  take.__type = TakerType.CaseSensitiveTextTaker;
  take.__str = str;

  return take;
}

export interface CaseInsensitiveTextTaker extends Taker {
  __type: TakerType.CaseInsensitiveTextTaker;
  __str: string;
  __locales: string | string[] | undefined;
}

export function createCaseInsensitiveTextTaker(str: string, locales: string | string[] | undefined): CaseInsensitiveTextTaker {

  const lowerCharCodes = toCharCodes(toLowerCase(str, locales));
  const upperCharCodes = toCharCodes(toUpperCase(str, locales));

  const take: CaseInsensitiveTextTaker = (input, offset) => {
    const strLength = str.length;

    for (let i = 0; i < strLength; ++i) {
      const charCode = input.charCodeAt(i + offset);

      if (charCode === lowerCharCodes[i] || charCode === upperCharCodes[i]) {
        continue;
      }
      return ResultCode.NO_MATCH;
    }
    return offset + strLength;
  };

  take.__type = TakerType.CaseInsensitiveTextTaker;
  take.__str = str;
  take.__locales = locales;

  return take;
}

function toLowerCase(str: string, locales: string | string[] | undefined): string {
  return locales ? str.toLocaleLowerCase(locales) : str.toLowerCase();
}

function toUpperCase(str: string, locales: string | string[] | undefined): string {
  return locales ? str.toLocaleUpperCase(locales) : str.toUpperCase();
}

function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}
