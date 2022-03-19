import {CharCodeChecker, Taker, ResultCode, TakerType} from './taker-types';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCodeChecker A function that receives a char code from the input and returns `true` if it matches.
 * @see {@link text}
 */
export function char(charCodeChecker: CharCodeChecker): Taker {
  return createCharTaker(charCodeChecker);
}

export interface CharTaker extends Taker {
  __type: TakerType.CHAR;
  __charCodeChecker: CharCodeChecker;
}

export function createCharTaker(charCodeChecker: CharCodeChecker): CharTaker {

  const take: CharTaker = (input, offset) => {
    return charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  };

  take.__type = TakerType.CHAR;
  take.__charCodeChecker = charCodeChecker;

  return take;
}
