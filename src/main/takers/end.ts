import {Var} from '../code';
import {InternalTaker, Qqq, Taker} from './taker-types';
import {createQqq, createSymbol} from './taker-utils';

/**
 * Creates taker that returns the input length plus the offset.
 *
 * @param offset The offset added to the input length.
 */
export function end(offset = 0): Taker {
  return new EndTaker(offset);
}

export const END_TYPE = createSymbol();

export class EndTaker implements InternalTaker {

  readonly type = END_TYPE;

  constructor(public offset: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): Qqq {
    return createQqq([
      resultVar, '=', inputVar, '.length', this.offset === 0 ? '' : '+' + this.offset, ';',
    ]);
  }
}
