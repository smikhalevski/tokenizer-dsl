import {createVar} from '../code';
import {InternalTaker, MAYBE_TYPE} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker, isTakerCodegen} from './taker-utils';

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

export function createMaybeTaker(baseTaker: Taker): MaybeTaker {

  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const baseTakerResultVar = createVar();

    return [
      'var ', baseTakerResultVar, ';',
      isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, offsetVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', offsetVar, ')', ';'],
      resultVar, '=', baseTakerResultVar, '===' + NO_MATCH + '?', offsetVar, ':', baseTakerResultVar, ';',
    ];
  };

  return createInternalTaker<MaybeTaker>(MAYBE_TYPE, factory, isTakerCodegen(baseTaker) ? baseTaker.bindings : [[baseTakerVar, baseTaker]]);
}
