import {createTaker, js} from './js';
import {InternalTaker, ResultCode, Taker, TakerCodeFactory, TakerType} from './taker-types';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(resultVar, '=' + ResultCode.NO_MATCH + ';');

export interface NoneTaker extends InternalTaker {
  __type: TakerType.NONE;
}

/**
 * Taker that always returns {@link ResultCode.NO_MATCH}.
 */
export const none: Taker = createTaker<NoneTaker>(TakerType.NONE, factory);
