import {createInternalTaker} from './js';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory} from './taker-types';

export function end(endOffset = 0): Taker {
  return createEndTaker(endOffset);
}

export interface EndTaker extends InternalTaker {
  type: InternalTakerType.END;
  endOffset: number;
}

export function createEndTaker(endOffset: number): EndTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', inputVar, '.length', endOffset === 0 ? '' : ['+', endOffset], ';',
  ];

  const taker = createInternalTaker<EndTaker>(InternalTakerType.END, factory);

  taker.endOffset = endOffset;

  return taker;
}
