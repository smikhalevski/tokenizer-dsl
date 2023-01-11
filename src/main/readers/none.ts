import { Reader } from './reader-types';
import { createCodeBindings } from './reader-utils';

/**
 * The singleton reader that always returns the current offset.
 *
 * @see {@linkcode skip}
 * @see {@linkcode end}
 */
export const none: Reader<any> = {
  factory(inputVar, offsetVar, contextVar, resultVar) {
    return createCodeBindings([resultVar, '=', offsetVar, ';']);
  },
};
