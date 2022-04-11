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
export function maybe<C = any>(taker: Taker<C>): Taker<C> {
  if (taker === none || taker === never) {
    return none;
  }
  return new MaybeTaker(taker);
}

export class MaybeTaker<C> implements TakerCodegen {

  constructor(public taker: Taker<C>) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const takerResultVar = createVar();

    return createCodeBindings(
        [
          'var ', takerResultVar, ';',
          createTakerCallCode(this.taker, inputVar, offsetVar, contextVar, takerResultVar, bindings),
          resultVar, '=', takerResultVar, '===', NO_MATCH, '?', offsetVar, ':', takerResultVar, ';',
        ],
        bindings,
    );
  }
}
