import {Taker} from '../types';
import {char} from './char';
import {ResultCode, takeNone, toCharCodes} from './taker-utils';
import {createNode, NodeType} from './node-utils';

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

    const charCodes = toCharCodes(str);

    if (strLength === 1) {
      return char(charCodes[0]);
    }

    return createNode(NodeType.TEXT_CASE_SENSITIVE, str, (input, offset) => {
      for (let i = 0; i < strLength; ++i) {
        if (input.charCodeAt(i + offset) === charCodes[i]) {
          continue;
        }
        return ResultCode.NO_MATCH;
      }
      return offset + strLength;
    });
  }

  const lowerCharCodes = toCharCodes(lowerStr);
  const upperCharCodes = toCharCodes(upperStr);

  return createNode(NodeType.TEXT_CASE_INSENSITIVE, str, (input, offset) => {
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
