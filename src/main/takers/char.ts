import {CharCodeChecker, Taker, ResultCode} from '../taker-types';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCodeChecker A function that receives a char code from the input and returns `true` if it matches.
 * @see {@link text}
 */
export function char(charCodeChecker: CharCodeChecker): Taker {
  return new CharTaker(charCodeChecker);
}

export class CharTaker implements Taker {

  public readonly __charCodeChecker;

  public constructor(charCodeChecker: CharCodeChecker) {
    this.__charCodeChecker = charCodeChecker;
  }

  public take(input: string, offset: number): number {
    return this.__charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  }
}
