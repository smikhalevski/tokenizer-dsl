import {Taker, ResultCode} from '../taker-types';

export function regex(re: RegExp): Taker {
  return new RegexTaker(re);
}

export class RegexTaker implements Taker {

  public readonly __re;

  public constructor(re: RegExp) {
    this.__re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));
  }

  public take(input: string, offset: number): number {
    const {__re} = this;

    __re.lastIndex = offset;

    const result = __re.exec(input);

    return result === null || result.index !== offset ? ResultCode.NO_MATCH : __re.lastIndex;
  }
}
