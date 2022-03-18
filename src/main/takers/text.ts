import {Taker, ResultCode} from '../taker-types';
import {noneTaker, toCharCodes} from '../taker-utils';

export interface TextOptions {

  /**
   * If set to `true` then string comparison is case insensitive.
   *
   * @default false
   */
  caseInsensitive?: boolean;
}

/**
 * Creates taker that reads a substring from the input.
 *
 * @param str The text to match.
 * @param options Taker options.
 * @see {@link char}
 */
export function text(str: string, options: TextOptions = {}): Taker {
  const {caseInsensitive = false} = options;

  const strLength = str.length;

  if (strLength === 0) {
    return noneTaker;
  }
  if (caseInsensitive && str.toLowerCase() !== str.toUpperCase()) {
    return new CaseInsensitiveTextTaker(str);
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

export class CaseSensitiveTextTaker implements Taker {

  public readonly __str;

  public constructor(str: string) {
    this.__str = str;
  }

  public take(input: string, offset: number): number {
    const {__str} = this;
    const strLength = __str.length;

    // input.startsWith(__str, offset) is slower
    return input.substr(offset, strLength) === __str ? offset + strLength : ResultCode.NO_MATCH;
  }
}

export class CaseInsensitiveTextTaker implements Taker {

  private readonly __str;
  private readonly __lowerCharCodes;
  private readonly __upperCharCodes;

  public constructor(str: string) {
    this.__str = str;
    this.__lowerCharCodes = toCharCodes(str.toLowerCase());
    this.__upperCharCodes = toCharCodes(str.toUpperCase());
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
