import {ResultCode} from '../ResultCode';
import {CharCodeChecker, Taker} from '../types';

/**
 * Creates a taker that takes a single char that matches the code.
 */
export function char(char: number | string | CharCodeChecker): Taker {
  if (typeof char === 'function') {
    return charBy(char);
  }

  char = typeof char === 'string' ? char.charAt(0) : char;

  return (input, offset) => input.charCodeAt(offset) === char ? offset + 1 : ResultCode.NO_MATCH;
}

/**
 * Creates a taker that takes a single char if it matches the checker.
 */
export function charBy(charCodeChecker: CharCodeChecker): Taker {
  const taker: Taker = (input, offset) => charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  taker.__factory = [charBy, charCodeChecker];
  return taker;
}
