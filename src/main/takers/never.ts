import {NO_MATCH, Taker} from './taker-types';
import {createCodeBindings} from './taker-utils';

/**
 * The singleton taker that always returns {@link NO_MATCH}.
 */
export const never: Taker<any> = {

  factory(inputVar, offsetVar, contextVar, resultVar) {
    return createCodeBindings([
      resultVar, '=', NO_MATCH, ';'
    ]);
  }
};
