import {Taker, ResultCode} from '../taker-types';
import {none} from './none';

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
      return new CaseInsensitiveCharTaker(str, locales);
    }
    return new CaseInsensitiveTextTaker(str, locales);
  }
  if (strLength === 1) {
    return new CaseSensitiveCharTaker(str);
  }
  return new CaseSensitiveTextTaker(str);
}

export class CaseSensitiveCharTaker implements Taker {

  public readonly __char;
  public readonly __charCode;

  public constructor(char: string) {
    this.__char = char;
    this.__charCode = char.charCodeAt(0);
  }

  public take(input: string, offset: number): number {
    return input.charCodeAt(offset) === this.__charCode ? offset + 1 : ResultCode.NO_MATCH;
  }
}

export class CaseInsensitiveCharTaker implements Taker {

  public readonly __char;
  public readonly __lowerCharCode;
  public readonly __upperCharCode;
  public readonly __locales;

  public constructor(char: string, locales: string | string[] | undefined) {
    this.__char = char;
    this.__lowerCharCode = toLowerCase(char, locales).charCodeAt(0);
    this.__upperCharCode = toUpperCase(char, locales).charCodeAt(0);
    this.__locales = locales;
  }

  public take(input: string, offset: number): number {
    const charCode = input.charCodeAt(offset);
    return charCode === this.__lowerCharCode || charCode === this.__upperCharCode ? offset + 1 : ResultCode.NO_MATCH;
  }
}

export class CaseSensitiveTextTaker implements Taker {

  public readonly __str;

  public constructor(str: string) {
    this.__str = str;
  }

  public take(input: string, offset: number): number {
    const {__str} = this;
    return input.startsWith(__str, offset) ? offset + __str.length : ResultCode.NO_MATCH;
  }
}

export class CaseInsensitiveTextTaker implements Taker {

  public readonly __str;
  public readonly __lowerCharCodes;
  public readonly __upperCharCodes;
  public readonly __locales;

  public constructor(str: string, locales: string | string[] | undefined) {
    this.__str = str;
    this.__lowerCharCodes = toCharCodes(toLowerCase(str, locales));
    this.__upperCharCodes = toCharCodes(toUpperCase(str, locales));
    this.__locales = locales;
  }

  public take(input: string, offset: number): number {

    const {
      __str,
      __lowerCharCodes,
      __upperCharCodes,
    } = this;

    const strLength = __str.length;

    for (let i = 0; i < strLength; ++i) {
      const charCode = input.charCodeAt(i + offset);

      if (charCode === __lowerCharCodes[i] || charCode === __upperCharCodes[i]) {
        continue;
      }
      return ResultCode.NO_MATCH;
    }
    return offset + strLength;
  }
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
