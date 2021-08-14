import {Taker} from '../types';
import {ResultCode} from '../ResultCode';

export interface ITextOptions {

  /**
   * If set to `true` then string comparison is case insensitive.
   *
   * @default false
   */
  caseInsensitive?: boolean;
}

/**
 * Creates a taker that takes the text.
 *
 * @param text The text to match.
 * @param options Taker options.
 */
export function text(text: string, options?: ITextOptions): Taker {
  return options?.caseInsensitive ? textCaseInsensitive(text) : textCaseSensitive(text);
}

function textCaseSensitive(text: string): Taker {
  const charCount = text.length;
  const charCodes = toCharCodes(text);

  return (input, offset) => {
    for (let i = 0; i < charCount; ++i) {
      if (input.charCodeAt(i + offset) !== charCodes[i]) {
        return ResultCode.NO_MATCH;
      }
    }
    return offset + charCount;
  };
}

function textCaseInsensitive(text: string): Taker {
  const charCount = text.length;

  const lowerCharCodes = toCharCodes(text.toLowerCase());
  const upperCharCodes = toCharCodes(text.toUpperCase());

  return (input, offset) => {
    for (let i = 0; i < charCount; ++i) {
      const charCode = input.charCodeAt(i + offset);

      if (charCode !== lowerCharCodes[i] && charCode !== upperCharCodes[i]) {
        return ResultCode.NO_MATCH;
      }
    }
    return offset + charCount;
  };
}

function toCharCodes(str: string): Array<number> {
  const charCodes: Array<number> = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}
