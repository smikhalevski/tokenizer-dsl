import {ResultCode, Taker, TakerType} from '../taker-types';
import {takeNone, toCharCodes, withType} from '../taker-utils';

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
export function text(str: string, options: ITextOptions = {}): Taker {
  const {caseSensitive = true} = options;

  const strLength = str.length;

  if (strLength === 0) {
    return takeNone;
  }

  const lowerStr = str.toLowerCase();
  const upperStr = str.toUpperCase();

  if (caseSensitive || lowerStr === upperStr) {
    let taker: Taker;

    if (strLength === 1) {
      const charCode = str.charCodeAt(0);
      taker = (input, offset) => input.charCodeAt(offset) === charCode ? offset + 1 : ResultCode.NO_MATCH;

    } else if (strLength > 17) {
      taker = (input, offset) => input.substr(offset, strLength) === str ? offset + strLength : ResultCode.NO_MATCH;

    } else {
      const charCodes = toCharCodes(str);
      taker = (input, offset) => {
        for (let i = 0; i < strLength; ++i) {
          if (input.charCodeAt(i + offset) === charCodes[i]) {
            continue;
          }
          return ResultCode.NO_MATCH;
        }
        return offset + strLength;
      };
    }

    return withType(TakerType.TEXT_CASE_SENSITIVE, str, taker);
  }

  const lowerCharCodes = toCharCodes(lowerStr);
  const upperCharCodes = toCharCodes(upperStr);

  return withType(TakerType.TEXT_CASE_INSENSITIVE, str, (input, offset) => {
    for (let i = 0; i < strLength; ++i) {
      const charCode = input.charCodeAt(i + offset);

      if (charCode === lowerCharCodes[i] || charCode === upperCharCodes[i]) {
        continue;
      }
      return ResultCode.NO_MATCH;
    }
    return offset + strLength;
  });
}
