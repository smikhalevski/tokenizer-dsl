import { Code, Var } from 'codedegen';
import { createVar, die } from '../utils';
import { none } from './none';
import { CodeBindings, Reader, ReaderCodegen } from './reader-types';
import { createCodeBindings, toCharCodes } from './reader-utils';

export type CharRange = string | number | [number | string, number | string];

export type CharCodeRange = number | [number, number];

/**
 * Creates a reader that matches a single char by its code.
 *
 * @param chars An array of strings (each char from string is used for matching), char codes, or tuples of lower/upper
 * chars (or char codes) that define an inclusive range of codes.
 * @see {@linkcode text}
 */
export function char(chars: CharRange[]): Reader<any> {
  const charCodeRanges: CharCodeRange[] = [];

  for (const range of chars) {
    if (typeof range === 'number') {
      charCodeRanges.push(toCharCode(range));
    } else if (typeof range === 'string') {
      charCodeRanges.push(...toCharCodes(range));
    } else {
      charCodeRanges.push([toCharCode(range[0]), toCharCode(range[1])]);
    }
  }

  if (charCodeRanges.length === 0) {
    return none;
  }

  return new CharCodeRangeReader(charCodeRanges);
}

export class CharCodeRangeReader implements ReaderCodegen {
  constructor(public charCodeRanges: CharCodeRange[]) {}

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const charCodeVar = createVar('charCode');

    // prettier-ignore
    return createCodeBindings([
      'var ', charCodeVar, ';',

      resultVar, '=',
      offsetVar, '<', inputVar, '.length&&(',
      charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, '),',
      createCharPredicateCode(charCodeVar, this.charCodeRanges), ')?', offsetVar, '+1:-1;',
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

function toCharCode(value: string | number): number {
  if (typeof value === 'number') {
    if (value < 0) {
      die('Illegal char code');
    }
    return value | 0;
  }
  if (value.length !== 1) {
    die('Expected a single char');
  }
  return value.charCodeAt(0);
}
