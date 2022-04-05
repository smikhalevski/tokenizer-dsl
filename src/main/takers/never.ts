import {InternalTaker, InternalTakerType, ResultCode, TakerFunction, TakerCodeFactory} from './taker-types';
import {compileInternalTaker} from './taker-utils';

const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
  resultVar, '=' + ResultCode.NO_MATCH + ';',
];

export interface NeverTaker extends InternalTaker {
  type: InternalTakerType.NEVER;
}

/**
 * Taker that always returns {@link ResultCode.NO_MATCH}.
 */
export const never: TakerFunction = compileInternalTaker<NeverTaker>(InternalTakerType.NEVER, factory);
