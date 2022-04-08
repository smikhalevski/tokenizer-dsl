import {NO_MATCH, Taker} from './taker-types';

/**
 * The singleton taker that always returns {@link NO_MATCH}.
 */
export const never: Taker = {

  factory(inputVar, offsetVar, resultVar) {
    return [
      resultVar, '=', NO_MATCH, ';',
    ];
  }
};
