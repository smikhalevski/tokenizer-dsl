import {createVar} from '../code';
import {InternalTaker, MAYBE_TYPE} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Taker} from './taker-types';
import {isTakerCodegen} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  if (taker === never || taker === none) {
    return taker;
  }
  return createMaybeTaker(taker);
}

export interface MaybeTaker extends InternalTaker {
  type: MAYBE_TYPE;
}

export function createMaybeTaker(taker: Taker): MaybeTaker {

  const takerVar = createVar();

  return {
    type: MAYBE_TYPE,
    bindings: isTakerCodegen(taker) ? taker.bindings : [[takerVar, taker]],

    factory(inputVar, offsetVar, resultVar) {
      const takerResultVar = createVar();

      return [
        'var ', takerResultVar, ';',
        isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', inputVar, ',', offsetVar, ')', ';'],
        resultVar, '=', takerResultVar, '===', NO_MATCH, '?', offsetVar, ':', takerResultVar, ';',
      ];
    },
  };
}
