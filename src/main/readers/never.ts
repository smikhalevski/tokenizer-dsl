import {NO_MATCH, Reader} from './reader-types';
import {createCodeBindings} from './reader-utils';

/**
 * The singleton reader that always returns {@link NO_MATCH}.
 */
export const never: Reader<any> = {

  factory(inputVar, offsetVar, contextVar, resultVar) {
    return createCodeBindings([
      resultVar, '=', NO_MATCH, ';'
    ]);
  }
};
