import {Taker} from '../types';
import {isAscii, lowerCharCodeAt} from '../ascii-utils';
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
export function text(text: string, options: ITextOptions = {}): Taker {
  const {caseInsensitive = false} = options;

  const charCount = text.length;

  if (caseInsensitive) {
    text = text.toLowerCase();
  }

  if (isAscii(text)) {
    return (input, offset) => {
      const lastIndex = offset + charCount;

      if (input.length < lastIndex) {
        return ResultCode.NO_MATCH;
      }
      for (let i = 0, j = offset; i < charCount; ++i, ++j) {
        const inputCharCode = caseInsensitive ? lowerCharCodeAt(input, j) : input.charCodeAt(j);
        if (inputCharCode !== text.charCodeAt(i)) {
          return ResultCode.NO_MATCH;
        }
      }
      return lastIndex;
    };
  }

  return (input, offset) => {
    const lastIndex = offset + charCount;

    if (input.length < lastIndex) {
      return ResultCode.NO_MATCH;
    }
    input = input.substr(offset, charCount);
    if (caseInsensitive) {
      input = input.toLowerCase();
    }
    return input === text ? lastIndex : ResultCode.NO_MATCH;
  };
}
