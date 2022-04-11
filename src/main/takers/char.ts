import {Code, createVar, Var} from '../code';
import {CharCodeRange, InternalTaker, NO_MATCH, CodeBindings, Taker} from './taker-types';
import {createCodeBindings, createTakerType, toCharCodes} from './taker-utils';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCodeRanges An array of char codes, or tuples of lower/upper char codes that define an inclusive range of codes.
 *
 * @see {@link text}
 */
export function char(charCodeRanges: CharCodeRange[]): Taker {
  return new CharCodeRangeTaker(charCodeRanges);
}

export const CHAR_CODE_RANGE_TYPE = createTakerType();

export class CharCodeRangeTaker implements InternalTaker {

  readonly type = CHAR_CODE_RANGE_TYPE;

  constructor(public charCodeRanges: CharCodeRange[]) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const charCodeVar = createVar();

    return createCodeBindings([
      'var ', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, ');',
      resultVar, '=', createCharCodePredicate(charCodeVar, this.charCodeRanges), '?', offsetVar, '+1:', NO_MATCH, ';',
    ]);
  }
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
