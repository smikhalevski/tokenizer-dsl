import {Binding, createVar, Var} from '../code';
import {InternalTaker, NO_MATCH, Qqq, Taker} from './taker-types';
import {createQqq, createSymbol, createTakerCall} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  return new MaybeTaker(taker);
}

export const MAYBE_TYPE = createSymbol();

export class MaybeTaker implements InternalTaker {

  readonly type = MAYBE_TYPE;

  constructor(public taker: Taker) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): Qqq {

    const bindings: Binding[] = [];
    const takerResultVar = createVar();

    return createQqq(
        [
          'var ', takerResultVar, ';',
          createTakerCall(this.taker, inputVar, offsetVar, takerResultVar, bindings),
          resultVar, '=', takerResultVar, '===', NO_MATCH, '?', offsetVar, ':', takerResultVar, ';',
        ],
        bindings,
    );
  }
}
