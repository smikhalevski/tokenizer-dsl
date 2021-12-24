import {ITaker} from '../taker-types';

export function end(offset = 0): ITaker {
  return new EndTaker(offset);
}

export class EndTaker implements ITaker {

  private _offset;

  public constructor(offset: number) {
    this._offset = offset;
  }

  public take(input: string, offset: number): number {
    return input.length + this._offset;
  }
}
