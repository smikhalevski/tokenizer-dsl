import {none} from './none';
import {CharCodeChecker, CharCodeRange, ResultCode, Taker, TakerType} from './taker-types';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCode A function that receives a char code from the input and returns `true` if it matches.
 * @see {@link text}
 */
export function char(charCode: CharCodeChecker | CharCodeRange[]): Taker {
  if (typeof charCode === 'function') {
    return createCharCodeCheckerTaker(charCode);
  }
  if (charCode.length === 0) {
    return none;
  }
  return createCharCodeRangeTaker(charCode);
}

export interface CharCodeCheckerTaker extends Taker {
  __type: TakerType.CHAR_CODE_CHECKER;
  __charCodeChecker: CharCodeChecker;
}

export function createCharCodeCheckerTaker(charCodeChecker: CharCodeChecker): CharCodeCheckerTaker {

  const take: CharCodeCheckerTaker = (input, offset) => {
    return charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  };

  take.__type = TakerType.CHAR_CODE_CHECKER;
  take.__charCodeChecker = charCodeChecker;

  return take;
}

export interface CharCodeRangeTaker extends Taker {
  __type: TakerType.CHAR_CODE_RANGE;
  __charCodeRanges: CharCodeRange[];
}

export function createCharCodeRangeTaker(charCodeRanges: CharCodeRange[]): CharCodeRangeTaker {
  const js = 'var c=i.charCodeAt(o);return '
      + createCharCodeRangeConditionSource('c', charCodeRanges)
      + '?o+1:'
      + ResultCode.NO_MATCH;

  const take = Function('i', 'o', js) as CharCodeRangeTaker;

  take.__type = TakerType.CHAR_CODE_RANGE;
  take.__charCodeRanges = charCodeRanges;

  return take;
}

export function createCharCodeRangeConditionSource(charCodeVar: string, charCodeRanges: CharCodeRange[]): string {
  return charCodeRanges.map((range) => typeof range === 'number' ? charCodeVar + '===' + range : charCodeVar + '>=' + range[0] + '&&' + charCodeVar + '<=' + range[1]).join('||');
}
