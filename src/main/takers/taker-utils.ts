import {InternalTaker} from './internal-taker-types';
import {Taker, TakerCodegen} from './taker-types';

export function isInternalTaker<T extends InternalTaker>(type: T['type'], taker: Taker | InternalTaker): taker is T {
  return 'type' in taker && taker.type === type;
}

export function isTakerCodegen(taker: Taker): taker is TakerCodegen {
  return 'factory' in taker;
}

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}
