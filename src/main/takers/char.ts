import {Code, createVar, Var} from '../code';
import {CHAR_CODE_CHECKER_TYPE, CHAR_CODE_RANGE_TYPE, InternalTaker} from './internal-taker-types';
import {none} from './none';
import {CharCodeChecker, CharCodeRange, CharCodeRangeLike, NO_MATCH, Taker} from './taker-types';
import {toCharCodeRanges} from './taker-utils';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCode A function that receives a char code from the input and returns `true` if it matches. Or an array of
 * char codes, or tuples of lower/upper char codes that define an inclusive range of codes.
 *
 * @see {@link text}
 */
export function char(charCode: CharCodeChecker | CharCodeRangeLike[]): Taker {
  if (typeof charCode === 'function') {
    return createCharCodeCheckerTaker(charCode);
  }
  const charCodeRanges = toCharCodeRanges(charCode);

  if (charCodeRanges.length === 0) {
    return none;
  }
  return createCharCodeRangeTaker(charCodeRanges);
}

export interface CharCodeCheckerTaker extends InternalTaker {
  type: CHAR_CODE_CHECKER_TYPE;
  charCodeChecker: CharCodeChecker;
}

export function createCharCodeCheckerTaker(charCodeChecker: CharCodeChecker): CharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();

  return {
    type: CHAR_CODE_CHECKER_TYPE,
    bindings: [[charCodeCheckerVar, charCodeChecker]],
    charCodeChecker,

    factory(inputVar, offsetVar, resultVar) {
      return [
        resultVar, '=', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', offsetVar, '))?', offsetVar, '+1:', NO_MATCH, ';',
      ];
    },
  };
}

export interface CharCodeRangeTaker extends InternalTaker {
  type: CHAR_CODE_RANGE_TYPE;
  charCodeRanges: CharCodeRange[];
}

export function createCharCodeRangeTaker(charCodeRanges: CharCodeRange[]): CharCodeRangeTaker {
  return {
    type: CHAR_CODE_RANGE_TYPE,
    charCodeRanges,

    factory(inputVar, offsetVar, resultVar) {

      const charCodeVar = createVar();

      return [
        'var ', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, ');',
        resultVar, '=', createCharPredicate(charCodeVar, charCodeRanges), '?', offsetVar, '+1:', NO_MATCH, ';',
      ];
    }
  };
}

export function createCharPredicate(charCodeVar: Var, charCodeRanges: CharCodeRange[]): Code {
  const code: Code[] = [];

  for (let i = 0; i < charCodeRanges.length; ++i) {
    const range = charCodeRanges[i];

    if (typeof range === 'number') {
      code.push(i > 0 ? '||' : '', charCodeVar, '===', range);
    } else {
      code.push(i > 0 ? '||' : '', charCodeVar, '>=', range[0], '&&', charCodeVar, '<=', range[1]);
    }
  }
  return code;
}
