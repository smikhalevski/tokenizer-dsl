import {Taker} from '../taker-types';
import {TakerType} from './TakerType';

export function end(endOffset = 0): Taker {
  return createEndTaker(endOffset);
}

export interface EndTaker extends Taker {
  __type: TakerType.EndTaker;
  __endOffset: number;
}

export function createEndTaker(endOffset: number): EndTaker {

  const take: EndTaker = (input) => {
    return input.length + endOffset;
  };

  take.__type = TakerType.EndTaker;
  take.__endOffset = endOffset;

  return take;
}
