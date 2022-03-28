import {TakerLike} from './takers';
import {toTaker} from './takers/taker-utils';
import {Token, TokenOptions} from './token-types';

/**
 * Creates the new token.
 *
 * @param taker The taker that takes chars from the string.
 * @param options Other options.
 * @returns The {@link Token} instance.
 */
export function createToken(taker: TakerLike, options?: TokenOptions): Token {
  return {
    taker: toTaker(taker),
    stages: options?.stages,
    nextStage: options?.nextStage,
  };
}
