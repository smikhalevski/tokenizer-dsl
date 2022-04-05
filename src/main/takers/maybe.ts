import {createVar} from '../code';
import {never} from './never';
import {none} from './none';
import {InternalTaker, InternalTakerType, ResultCode, TakerFunction, TakerCodeFactory, Taker} from './taker-types';
import {compileInternalTaker, isTakerCodegen} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): TakerFunction {
  if (taker === never || taker === none) {
    return taker;
  }
  return createMaybeTaker(taker);
}

export interface MaybeTaker extends InternalTaker {
  type: InternalTakerType.MAYBE;
}

export function createMaybeTaker(baseTaker: Taker): MaybeTaker {

  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const baseTakerResultVar = createVar();

    return [
      'var ', baseTakerResultVar, ';',
      isTakerCodegen(baseTaker) ? baseTaker.factory(inputVar, offsetVar, baseTakerResultVar) : [baseTakerResultVar, '=', baseTakerVar, '(', inputVar, ',', offsetVar, ')', ';'],
      resultVar, '=', baseTakerResultVar, '===' + ResultCode.NO_MATCH + '?', offsetVar, ':', baseTakerResultVar, ';',
    ];
  };

  return compileInternalTaker<MaybeTaker>(InternalTakerType.MAYBE, factory, isTakerCodegen(baseTaker) ? baseTaker.bindings : [[baseTakerVar, baseTaker]]);
}
