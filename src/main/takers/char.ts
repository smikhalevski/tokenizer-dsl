import {CharCodeChecker, ResultCode, Taker, TakerType} from '../taker-types';
import {withType} from '../taker-utils';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCodeChecker A function that receives a char code from the input and returns `true` if it matches.
 * @see {@link text}
 */
export function char(charCodeChecker: CharCodeChecker): Taker {
  return withType(TakerType.CHAR, charCodeChecker, (input, offset) => charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH);
}
