import {ResultCode, Taker, TakerType} from './taker-types';

export const takeNone = withType(TakerType.NONE, undefined, (input, offset) => offset);

export const takeNever = withType(TakerType.NEVER, undefined, () => ResultCode.NO_MATCH);

export function toCharCodes(str: string): Array<number> {
  const charCodes: Array<number> = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function withType(type: TakerType, data: any, taker: Taker): Taker {
  taker.type = type;
  taker.data = data;
  return taker;
}
