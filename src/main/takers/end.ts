import {Var} from '../code';
import {CodeBindings, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings} from './taker-utils';

/**
 * Creates taker that returns the input length plus the offset.
 *
 * @param offset The offset added to the input length.
 *
 * @see {@link skip}
 */
export function end(offset = 0): Taker {
  return new EndTaker(offset);
}

export class EndTaker implements TakerCodegen {

  constructor(public offset: number) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {offset} = this;

    return createCodeBindings([
      resultVar, '=', inputVar, '.length', offset === 0 ? '' : '+' + offset, ';',
    ]);
  }
}
