import {TakerLike, toTaker} from '../takers';
import {Rule} from './rule-types';

/**
 * Creates the new rule that reads tokens.
 */
export function rule<Stage = never>(taker: TakerLike, stages?: Stage[], nextStage?: Stage): Rule<Stage> {
  return {
    taker: toTaker(taker),
    stages,
    nextStage,
  };
}
