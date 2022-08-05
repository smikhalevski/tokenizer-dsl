import { Reader } from './reader-types';
import { createCodeBindings } from './reader-utils';

/**
 * The singleton reader that always returns -1.
 */
export const never: Reader<any> = {

  factory(inputVar, offsetVar, contextVar, resultVar) {
    return createCodeBindings([
      resultVar, '=-1;',
    ]);
  }
};
