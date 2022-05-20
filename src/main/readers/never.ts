import {Reader} from './reader-types';
import {createCodeBindings, NO_MATCH} from './reader-utils';

/**
 * The singleton reader that always returns -1.
 */
export const never: Reader<any> = {

  factory(inputVar, offsetVar, contextVar, resultVar) {
    return createCodeBindings([
      resultVar, '=' + NO_MATCH + ';',
    ]);
  }
};
