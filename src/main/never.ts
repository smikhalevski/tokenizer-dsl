import {compileInternalTaker} from './code';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory} from './taker-types';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=' + ResultCode.NO_MATCH + ';',
];

export interface NeverTaker extends InternalTaker {
  type: InternalTakerType.NEVER;
}

/**
 * Taker that always returns {@link ResultCode.NO_MATCH}.
 */
export const never: Taker = compileInternalTaker<NeverTaker>(InternalTakerType.NEVER, factory);
