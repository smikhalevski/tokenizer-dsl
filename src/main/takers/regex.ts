import {Taker, ResultCode} from '../taker-types';

export function regex(pattern: RegExp): Taker {
  return new RegexTaker(pattern);
}

export class RegexTaker implements Taker {

  private readonly __pattern;

  public constructor(pattern: RegExp) {
    this.__pattern = pattern;

    if (pattern.sticky !== undefined) {
      if (!pattern.sticky) {
        this.__pattern = RegExp(pattern, pattern.flags + 'y');
      }
    } else {
      if (!pattern.global) {
        this.__pattern = RegExp(pattern, pattern.flags + 'g');
      }
    }
  }

  public take(input: string, offset: number): number {
    const {__pattern} = this;

    __pattern.lastIndex = offset;

    const result = __pattern.exec(input);

    return result === null || result.index !== offset ? ResultCode.NO_MATCH : __pattern.lastIndex;
  }
}
