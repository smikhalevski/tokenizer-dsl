import {TakerLike} from './takers';
import {toTaker} from './takers/taker-utils';
import {Rule} from './rule-types';

/**
 * Creates the new token.
 */
export function rule(taker: TakerLike, stages?: unknown[], nextStage?: unknown): Rule {
  return {
    taker: toTaker(taker),
    stages,
    nextStage,
  };
}
