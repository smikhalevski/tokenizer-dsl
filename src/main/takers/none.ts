import {Taker} from './taker-types';

/**
 * The singleton taker that always returns the current offset.
 */
export const none: Taker = {

  factory(inputVar, offsetVar, resultVar) {
    return [
      resultVar, '=', offsetVar, ';',
    ];
  }
};
