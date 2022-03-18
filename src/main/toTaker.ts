import {Taker, TakerLike} from './taker-types';

/**
 * Converts a function to a {@link Taker} instance.
 *
 * @param taker The function or a {@link Taker} instance.
 */
export function toTaker(taker: TakerLike): Taker {
  return typeof taker === 'function' ? {take: taker} : taker;
}
