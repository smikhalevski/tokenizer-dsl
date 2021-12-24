import {CharCodeChecker, ITaker, ResultCode} from '../taker-types';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCodeChecker A function that receives a char code from the input and returns `true` if it matches.
 * @see {@link text}
 */
export function char(charCodeChecker: CharCodeChecker): ITaker {
  return new CharTaker(charCodeChecker);
}

export class CharTaker implements ITaker {

  public _charCodeChecker;

  public constructor(charCodeChecker: CharCodeChecker) {
    this._charCodeChecker = charCodeChecker;
  }

  public take(input: string, offset: number): number {
    return this._charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  }
}
