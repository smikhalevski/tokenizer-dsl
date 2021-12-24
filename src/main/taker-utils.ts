import {ITaker, ResultCode, TakerLike} from './taker-types';

export class NeverTaker implements ITaker {

  public take(): number {
    return ResultCode.NO_MATCH;
  }
}

export class NoneTaker implements ITaker {

  public take(input: string, offset: number): number {
    return offset;
  }
}

export const noneTaker = new NoneTaker();

export const neverTaker = new NeverTaker();

export function toCharCodes(str: string): Array<number> {
  const charCodes: Array<number> = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function toTaker(taker: TakerLike): ITaker {
  return typeof taker === 'function' ? {take: taker} : taker;
}
