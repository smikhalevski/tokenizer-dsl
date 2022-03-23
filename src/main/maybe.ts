import {isAllTaker} from './all';
import {createTaker, createVar, js} from './js';
import {never} from './never';
import {none} from './none';
import {InternalTaker, ResultCode, Taker, TakerCodeFactory, TakerType} from './taker-types';
import {isInternalTaker} from './taker-utils';

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  if (taker === never || taker === none || isAllTaker(taker) && taker.__minimumCount === 0) {
    return taker;
  }
  return createMaybeTaker(taker);
}

export interface MaybeTaker extends InternalTaker {
  __type: TakerType.MAYBE;
  __baseTaker: Taker;
}

export function createMaybeTaker(baseTaker: Taker): MaybeTaker {

  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      isInternalTaker(baseTaker) ? taker.__factory(inputVar, offsetVar, resultVar) : [resultVar, '=', baseTakerVar, '(', inputVar, ',', offsetVar, ')', ';'],
      resultVar, '=', resultVar, '===' + ResultCode.NO_MATCH, '?', offsetVar, ':', resultVar, ';',
  );

  const taker = createTaker<MaybeTaker>(TakerType.MAYBE, factory, [[baseTakerVar, baseTaker]]);

  taker.__baseTaker = baseTaker;

  return taker;
}
