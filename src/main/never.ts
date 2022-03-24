import {createInternalTaker} from './js';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory, TakerCodegen} from './taker-types';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=' + ResultCode.NO_MATCH + ';',
];

export interface NeverTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.NEVER;
}

/**
 * Taker that always returns {@link ResultCode.NO_MATCH}.
 */
export const never: Taker = createInternalTaker<NeverTaker>(InternalTakerType.NEVER, factory);
