import {Code, createVar, Var} from '../code';
import {CHAR_CODE_RANGE_TYPE, InternalTaker} from './internal-taker-types';
import {none} from './none';
import {CharCodeRange, NO_MATCH, Taker} from './taker-types';
import {toCharCodes} from './taker-utils';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCodeRanges An array of char codes, or tuples of lower/upper char codes that define an inclusive range of codes.
 *
 * @see {@link text}
 */
export function char(charCodeRanges: CharCodeRange[]): Taker {
  if (charCodeRanges.length === 0) {
    return none;
  }
  return createCharCodeRangeTaker(charCodeRanges);
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
        resultVar, '=', createCharCodePredicate(charCodeVar, charCodeRanges), '?', offsetVar, '+1:', NO_MATCH, ';',
      ];
    }
  };
}

export function createCharCodePredicate(charCodeVar: Var, charCodeRanges: CharCodeRange[]): Code {
  const code: Code[] = [];

  for (let i = 0; i < charCodeRanges.length; ++i) {
    const value = charCodeRanges[i];

    if (typeof value === 'string') {
      code.push(createCharCodePredicate(charCodeVar, toCharCodes(value)));
      continue;
    }
    if (typeof value === 'number') {
      code.push('||', charCodeVar, '===', value | 0);
    } else {
      code.push('||', charCodeVar, '>=', value[0] | 0, '&&', charCodeVar, '<=', value[1] | 0);
    }
  }
  return code.slice(1);
}
