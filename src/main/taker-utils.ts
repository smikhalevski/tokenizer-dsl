import {InternalTaker, Taker} from './taker-types';

export function isTaker<T extends Taker>(taker: Taker, type: T['__type']): taker is T {
  return taker.__type === type;
}

export function isInternalTaker(taker: Taker): taker is InternalTaker {
  return '__factory' in taker;
}
