import {InternalTaker, NONE_TYPE} from './internal-taker-types';
import {Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker} from './taker-utils';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=', offsetVar, ';',
];

export interface NoneTaker extends InternalTaker {
  type: NONE_TYPE;
}

/**
 * Taker that always returns the current offset.
 */
export const none: Taker = createInternalTaker<NoneTaker>(NONE_TYPE, factory);
