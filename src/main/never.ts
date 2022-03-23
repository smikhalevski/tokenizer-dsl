import {createTaker, js} from './js';
import {InternalTaker, Taker, TakerCodeFactory, TakerType} from './taker-types';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(resultVar, '=', offsetVar, ';');

export interface NeverTaker extends InternalTaker {
  __type: TakerType.NEVER;
}

/**
 * Taker that returns the current offset.
 */
export const never: Taker = createTaker<NeverTaker>(TakerType.NEVER, factory);
