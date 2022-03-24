import {InternalTaker, TakerCodegen, TakerLike} from './taker-types';

export function isInternalTaker<T extends InternalTaker>(taker: TakerLike | InternalTaker, type: T['type']): taker is T {
  return 'type' in taker && taker.type === type;
}

export function isTakerCodegen(taker: TakerLike | InternalTaker): taker is TakerCodegen {
  return 'factory' in taker;
}
