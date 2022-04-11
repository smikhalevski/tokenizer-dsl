import {Taker} from './taker-types';
import {createCodeBindings} from './taker-utils';

/**
 * The singleton taker that always returns the current offset.
 */
export const none: Taker = {

  factory(inputVar, offsetVar, resultVar) {
    return createCodeBindings([
      resultVar, '=', offsetVar, ';',
    ]);
  }
};
