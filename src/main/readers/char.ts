import {Code, createVar, Var} from '../code';
import {none} from './none';
import {CodeBindings, NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, toCharCodes} from './reader-utils';

export type CharCodeRange = number | [number, number];

/**
 * Creates a reader that matches a single char by its code.
 *
 * @param ranges An array of char codes, or tuples of lower/upper char codes that define an inclusive range of codes.
 * If a string is provided then any char from the string would fit.
 *
 * @see {@link text}
 */
export function char(ranges: (string | number | [number, number])[]): Reader<any> {
  const charCodeRanges: CharCodeRange[] = [];

  for (const range of ranges) {

    if (typeof range === 'string') {
      charCodeRanges.push(...toCharCodes(range));
    } else {
      charCodeRanges.push(range);
    }
  }
  if (charCodeRanges.length === 0) {
    return none;
  }

  return new CharCodeRangeReader(charCodeRanges);
}

export class CharCodeRangeReader implements ReaderCodegen {

  constructor(public charCodeRanges: CharCodeRange[]) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const charCodeVar = createVar();

    return createCodeBindings([
      'var ', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, ');',
      resultVar, '=', createCharPredicateCode(charCodeVar, this.charCodeRanges), '?', offsetVar, '+1:', NO_MATCH, ';',
    ]);
  }
}

export function createCharPredicateCode(charCodeVar: Var, charCodeRanges: CharCodeRange[]): Code {
  const code: Code[] = [];

  for (let i = 0; i < charCodeRanges.length; ++i) {
    const range = charCodeRanges[i];

    if (i > 0) {
      code.push('||');
    }
    if (typeof range === 'number') {
      code.push(charCodeVar, '===', range);
    } else {
      code.push(charCodeVar, '>=', range[0], '&&', charCodeVar, '<=', range[1]);
    }
  }
  return code;
}
