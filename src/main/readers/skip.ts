import {CodeBindings, Var} from 'codedegen';
import {NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings} from './reader-utils';

/**
 * Creates a reader that skips given number of chars.
 *
 * @param charCount The number of chars to skip.
 *
 * @see {@link end}
 */
export function skip(charCount: number): Reader<any> {
  return new SkipReader(charCount);
}

export class SkipReader implements ReaderCodegen {

  constructor(public charCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCount} = this;

    return createCodeBindings([
      resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length?', offsetVar, '+', charCount, ':', NO_MATCH, ';',
    ]);
  }
}
