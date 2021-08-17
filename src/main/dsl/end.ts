import {Taker} from '../types';

export function end(offset = 0): Taker {
  return (input) => input.length + offset;
}
