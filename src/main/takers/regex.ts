import {ITaker, ResultCode} from '../taker-types';

export function regex(pattern: RegExp): ITaker {
  return new RegexTaker(pattern);
}

export class RegexTaker implements ITaker {

  private _pattern;

  public constructor(pattern: RegExp) {
    this._pattern = pattern;

    if (pattern.sticky !== undefined) {
      if (!pattern.sticky) {
        this._pattern = RegExp(pattern, pattern.flags + 'y');
      }
    } else {
      if (!pattern.global) {
        this._pattern = RegExp(pattern, pattern.flags + 'g');
      }
    }
  }

  public take(input: string, offset: number): number {
    const pattern = this._pattern;
    pattern.lastIndex = offset;

    const result = pattern.exec(input);

    return result === null || result.index !== offset ? ResultCode.NO_MATCH : pattern.lastIndex;
  }
}
