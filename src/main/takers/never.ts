import {InternalTaker, NEVER_TYPE} from './internal-taker-types';
import {NO_MATCH, Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker} from './taker-utils';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=' + NO_MATCH + ';',
];

export interface NeverTaker extends InternalTaker {
  type: NEVER_TYPE;
}

/**
 * Taker that always returns {@link NO_MATCH}.
 */
export const never: Taker = createInternalTaker<NeverTaker>(NEVER_TYPE, factory);
