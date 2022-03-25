import {createInternalTaker} from './js';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory} from './taker-types';

/**
 * Creates taker that returns the input length plus the offset.
 *
 * @param offset The offset added to the input length.
 */
export function end(offset = 0): Taker {
  return createEndTaker(offset | 0);
}

export interface EndTaker extends InternalTaker {
  type: InternalTakerType.END;
}

export function createEndTaker(offset: number): EndTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', inputVar, '.length', offset === 0 ? '' : '+' + offset, ';',
  ];

  return createInternalTaker<EndTaker>(InternalTakerType.END, factory);
}
