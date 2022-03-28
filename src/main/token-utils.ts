import {Taker, TakerLike} from './takers';
import {toTaker} from './takers/taker-utils';

/**
 * Defines how tokens are read from the input string.
 */
export interface Token extends TokenOptions {

  /**
   * The taker that takes chars from the string.
   */
  taker: Taker;
}

/**
 * The options of the token.
 */
export interface TokenOptions {

  /**
   * The list of stages at which token can be used. If omitted then token is used on all stages. If an empty array
   * then token is never used.
   *
   * @default undefined
   */
  stages?: unknown[] | undefined;

  /**
   * The stage which should be used for next token if this token has successfully read the token.
   *
   * If `undefined` the next stage is set to the current stage.
   *
   * @default undefined
   */
  nextStage?: unknown;
}

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
