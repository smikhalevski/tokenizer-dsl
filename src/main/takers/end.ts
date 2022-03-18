import {Taker} from '../taker-types';

export function end(offset = 0): Taker {
  return new EndTaker(offset);
}

export class EndTaker implements Taker {

  public readonly __offset;

  public constructor(offset: number) {
    this.__offset = offset;
  }

  public take(input: string, offset: number): number {
    return input.length + this.__offset;
  }
}
