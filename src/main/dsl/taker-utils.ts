import {Taker} from '../types';

export const enum ResultCode {
  NO_MATCH = -1,
}

export const takeNone: Taker = (input, offset) => offset;

export const takeNoMatch: Taker = () => ResultCode.NO_MATCH;

export function toCharCodes(str: string): Array<number> {
  const charCodes: Array<number> = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}
