import {Taker} from '../taker-types';

/**
 * Taker that returns the current offset.
 */
export const never: Taker = (input, offset) => offset;
