import {CodeBindings, Var} from '../code';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings} from './reader-utils';

/**
 * Creates a reader that returns the input length plus the offset.
 *
 * @param offset The offset added to the input length.
 *
 * @see {@link skip}
 */
export function end(offset = 0): Reader<any> {
  return new EndReader(offset);
}

export class EndReader implements ReaderCodegen {

  constructor(public offset: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {offset} = this;

    return createCodeBindings([
      resultVar, '=', inputVar, '.length', offset === 0 ? '' : '+' + offset, ';',
    ]);
  }
}
