import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory} from './taker-types';
import {compileInternalTaker} from './taker-utils';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=', offsetVar, ';',
];

export interface NoneTaker extends InternalTaker {
  type: InternalTakerType.NONE;
}

/**
 * Taker that always returns the current offset.
 */
export const none: Taker = compileInternalTaker<NoneTaker>(InternalTakerType.NONE, factory);