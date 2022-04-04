import {TakerLike} from './takers';
import {toTaker} from './takers/taker-utils';
import {Token} from './token-types';

/**
 * Creates the new token.
 */
export function createToken(taker: TakerLike, stages?: unknown[], nextStage?: unknown): Token {
  return {
    taker: toTaker(taker),
    stages,
    nextStage,
  };
}
