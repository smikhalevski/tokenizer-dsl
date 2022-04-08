import {END_TYPE, InternalTaker} from './internal-taker-types';
import {Taker} from './taker-types';

/**
 * Creates taker that returns the input length plus the offset.
 *
 * @param offset The offset added to the input length.
 */
export function end(offset = 0): Taker {
  return createEndTaker(offset | 0);
}

export interface EndTaker extends InternalTaker {
  type: END_TYPE;
}

export function createEndTaker(offset: number): EndTaker {
  return {
    type: END_TYPE,

    factory(inputVar, offsetVar, resultVar) {
      return [
        resultVar, '=', inputVar, '.length', offset === 0 ? '' : '+' + offset, ';',
      ];
    },
  };
}
