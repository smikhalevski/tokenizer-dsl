import {createInternalTaker} from './js';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory} from './taker-types';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=', offsetVar, ';',
];

export interface NoneTaker extends InternalTaker {
  type: InternalTakerType.NONE;
}

/**
 * Taker that always returns the current offset.
 */
export const none: Taker = createInternalTaker<NoneTaker>(InternalTakerType.NONE, factory);
