import {Binding, createVar, Var} from '../code';
import {never} from './never';
import {none} from './none';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, createTakerCallCode} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  if (taker === none || taker === never) {
    return none;
  }
  return new MaybeTaker(taker);
}

export class MaybeTaker implements TakerCodegen {

  constructor(public taker: Taker) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const takerResultVar = createVar();

    return createCodeBindings(
        [
          'var ', takerResultVar, ';',
          createTakerCallCode(this.taker, inputVar, offsetVar, takerResultVar, bindings),
          resultVar, '=', takerResultVar, '===', NO_MATCH, '?', offsetVar, ':', takerResultVar, ';',
        ],
        bindings,
    );
  }
}
