import {createTaker, js} from './js';
import {InternalTaker, Taker, TakerCodeFactory, TakerType} from './taker-types';

export function end(endOffset = 0): Taker {
  return createEndTaker(endOffset);
}

export interface EndTaker extends InternalTaker {
  __type: TakerType.END;
  __endOffset: number;
}

export function createEndTaker(endOffset: number): EndTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      resultVar, '=', inputVar, '.length+', offsetVar, ';',
  );

  const taker = createTaker<EndTaker>(TakerType.END, factory);

  taker.__endOffset = endOffset;

  return taker;
}
