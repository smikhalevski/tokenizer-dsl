import {CharCodeChecker, Taker} from '../types';
import {ResultCode} from './taker-utils';
import {createNode, NodeType} from './node-utils';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCode The char code or a function that receives a char code from the input and returns `true` if it
 *     matches, `false` otherwise.
 * @see {@link text}
 */
export function char(charCode: number | CharCodeChecker): Taker {

  if (typeof charCode === 'number') {
    return createNode(NodeType.CHAR_CASE_SENSITIVE, charCode, (input, offset) => {
      return input.charCodeAt(offset) === charCode ? offset + 1 : ResultCode.NO_MATCH;
    });
  }

  return createNode(NodeType.CHAR_CODE_CHECKER, charCode, (input, offset) => {
    return charCode(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  });
}
