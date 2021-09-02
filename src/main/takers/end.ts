import {Taker, TakerType} from '../taker-types';
import {withType} from '../taker-utils';

export function end(offset = 0): Taker {
  return withType(TakerType.END, offset, (input) => input.length + offset);
}
