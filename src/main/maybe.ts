import {createInternalTaker, createVar} from './js';
import {never} from './never';
import {none} from './none';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory, TakerLike} from './taker-types';
import {isTakerCodegen} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: TakerLike): Taker {
  if (taker === never || taker === none) {
    return taker;
  }
  return createMaybeTaker(taker);
}

export interface MaybeTaker extends InternalTaker {
  type: InternalTakerType.MAYBE;
  baseTaker: TakerLike;
}

export function createMaybeTaker(baseTaker: TakerLike): MaybeTaker {

  const baseTakerVar = createVar();
  const baseTakerResultVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', baseTakerResultVar, ';',
    isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, offsetVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', offsetVar, ')', ';'],
    resultVar, '=', baseTakerResultVar, '===' + ResultCode.NO_MATCH + '?', offsetVar, ':', baseTakerResultVar, ';',
  ];

  return createInternalTaker<MaybeTaker>(InternalTakerType.MAYBE, factory, isTakerCodegen(baseTaker) ? baseTaker.values : [[baseTakerVar, baseTaker]]);
}
