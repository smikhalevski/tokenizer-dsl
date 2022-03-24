import {createInternalTaker} from './js';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory, TakerCodegen} from './taker-types';

export function end(endOffset = 0): Taker {
  return createEndTaker(endOffset);
}

export interface EndTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.END;
  endOffset: number;
}

export function createEndTaker(endOffset: number): EndTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', inputVar, '.length+', offsetVar, ';',
  ];

  const taker = createInternalTaker<EndTaker>(InternalTakerType.END, factory);

  taker.endOffset = endOffset;

  return taker;
}
