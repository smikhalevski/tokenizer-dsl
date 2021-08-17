import {Taker} from '../types';
import {ResultCode, takeNoMatch, takeNone} from './taker-utils';
import {isNode, NodeProperty, NodeType} from './node-utils';

export interface IAllOptions {

  /**
   * The minimum number of matches to consider success.
   *
   * @default 0
   */
  minimumCount?: number;

  /**
   * The maximum number of matches to read.
   *
   * @default Infinity
   */
  maximumCount?: number;
}

/**
 * Creates taker that repeatedly takes chars using `taker`.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function all(taker: Taker, options: IAllOptions = {}): Taker {
  const {minimumCount = 0, maximumCount = Infinity} = options;

  if (minimumCount > maximumCount) {
    return takeNoMatch;
  }
  if (maximumCount === 0) {
    return takeNone;
  }

  if (isNode(taker, NodeType.CHAR_CODE_CHECKER)) {
    const charCodeChecker = taker[NodeProperty.VALUE];

    return (input, offset) => {
      const maximumOffset = offset + maximumCount;
      let i = offset;
      while (charCodeChecker(input.charCodeAt(i)) && i < maximumOffset) {
        ++i;
      }
      if (i - offset < minimumCount) {
        return ResultCode.NO_MATCH;
      }
      return i;
    };
  }

  return (input, offset) => {
    let takeCount = 0;
    let result = offset;
    let i;

    do {
      i = result;
      result = taker(input, i);
    } while (result > i && ++takeCount < maximumCount);

    if (takeCount < minimumCount) {
      return ResultCode.NO_MATCH;
    }
    if (result === ResultCode.NO_MATCH) {
      return i;
    }
    return result;
  };
}