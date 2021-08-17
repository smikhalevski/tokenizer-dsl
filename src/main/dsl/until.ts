import {Taker} from '../types';
import {ResultCode} from './taker-utils';
import {isNode, NodeProperty, NodeType} from './node-utils';

export interface IUntilOptions {

  /**
   * If set to `true` then chars matched by `taker` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;
}

/**
 * Creates taker that takes chars until `taker` matches.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function until(taker: Taker, options: IUntilOptions = {}): Taker {
  const {inclusive = false} = options;

  const searchStr =
      isNode(taker, NodeType.CHAR_CASE_SENSITIVE) ? String.fromCharCode(taker[NodeProperty.VALUE]) :
      isNode(taker, NodeType.TEXT_CASE_SENSITIVE) ? taker[NodeProperty.VALUE] :
      null;

  if (searchStr != null) {
    const takenOffset = inclusive ? searchStr.length : 0;

    return (input, offset) => {
      const index = input.indexOf(searchStr, offset);

      if (index === -1) {
        return ResultCode.NO_MATCH;
      }
      return index + takenOffset;
    };
  }

  if (isNode(taker, NodeType.CHAR_CODE_CHECKER)) {
    const charCodeChecker = taker[NodeProperty.VALUE];
    const takenOffset = inclusive ? 1 : 0;

    return (input, offset) => {
      let i = offset;
      while (!charCodeChecker(input.charCodeAt(i))) {
        ++i;
      }
      if (i === input.length) {
        return ResultCode.NO_MATCH;
      }
      return i + takenOffset;
    };
  }

  return (input, offset) => {
    let result;
    let i = offset;

    do {
      result = taker(input, i);
      ++i;
    } while (result === ResultCode.NO_MATCH);

    if (result < 0) {
      return result;
    }
    return inclusive ? result : i - 1;
  };
}
