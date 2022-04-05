import {TakerLike, toTaker} from '../takers';
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
