import {Taker, TakerType} from './taker-types';

export function end(endOffset = 0): Taker {
  return createEndTaker(endOffset);
}

export interface EndTaker extends Taker {
  __type: TakerType.END;
  __endOffset: number;
}

export function createEndTaker(endOffset: number): EndTaker {

  const take: EndTaker = (input) => {
    return input.length + endOffset;
  };

  take.__type = TakerType.END;
  take.__endOffset = endOffset;

  return take;
}
