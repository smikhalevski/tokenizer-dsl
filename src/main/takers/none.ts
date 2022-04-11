import {Taker} from './taker-types';
import {createCodeBindings} from './taker-utils';

/**
 * The singleton taker that always returns the current offset.
 *
 * @see {@link skip}
 * @see {@link end}
 */
export const none: Taker = {

  factory(inputVar, offsetVar, resultVar) {
    return createCodeBindings([
      resultVar, '=', offsetVar, ';',
    ]);
  }
};
