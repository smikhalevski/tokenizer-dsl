import {ITaker, ResultCode} from '../taker-types';
import {noneTaker, toCharCodes} from '../taker-utils';

export interface ITextOptions {

  /**
   * If set to `false` then string comparison is case insensitive.
   *
   * @default true
   */
  caseSensitive?: boolean;
}

/**
 * Creates taker that reads a substring from the input.
 *
 * @param str The text to match.
 * @param options Taker options.
 * @see {@link char}
 */
export function text(str: string, options: ITextOptions = {}): ITaker {
  const {caseSensitive = true} = options;

  const strLength = str.length;

  if (strLength === 0) {
    return noneTaker;
  }
  if (!caseSensitive && str.toLowerCase() !== str.toUpperCase()) {
    return new CaseInsensitiveTextTaker(str);
  }
  if (strLength === 1) {
    return new CaseSensitiveCharTaker(str);
  }
  return new CaseSensitiveTextTaker(str);
}

export class CaseSensitiveCharTaker implements ITaker {

  public _char;
  public _charCode;

  public constructor(char: string) {
    this._char = char;
    this._charCode = char.charCodeAt(0);
  }

  public take(input: string, offset: number): number {
    return input.charCodeAt(offset) === this._charCode ? offset + 1 : ResultCode.NO_MATCH;
  }
}

export class CaseSensitiveTextTaker implements ITaker {

  public _str;

  public constructor(str: string) {
    this._str = str;
  }

  public take(input: string, offset: number): number {
    const str = this._str;
    const strLength = str.length;
    return input.substr(offset, strLength) === str ? offset + strLength : ResultCode.NO_MATCH;
  }
}

export class CaseInsensitiveTextTaker implements ITaker {

  private _str;
  private _lowerCharCodes;
  private _upperCharCodes;

  public constructor(str: string) {
    this._str = str;
    this._lowerCharCodes = toCharCodes(str.toLowerCase());
    this._upperCharCodes = toCharCodes(str.toUpperCase());
  }

  public take(input: string, offset: number): number {
    const strLength = this._str.length;
    const lowerCharCodes = this._lowerCharCodes;
    const upperCharCodes = this._upperCharCodes;

    for (let i = 0; i < strLength; ++i) {
      const charCode = input.charCodeAt(i + offset);

      if (charCode === lowerCharCodes[i] || charCode === upperCharCodes[i]) {
        continue;
      }
      return ResultCode.NO_MATCH;
    }
    return offset + strLength;
  }
}
