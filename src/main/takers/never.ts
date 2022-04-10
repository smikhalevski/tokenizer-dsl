import {NO_MATCH, Taker} from './taker-types';
import {createQqq} from './taker-utils';

/**
 * The singleton taker that always returns {@link NO_MATCH}.
 */
export const never: Taker = {

  factory(inputVar, offsetVar, resultVar) {
    return createQqq([
      resultVar, '=', NO_MATCH, ';'
    ]);
  }
};
