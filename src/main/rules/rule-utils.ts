import {Binding, Code, compileFunction, createVar} from '../code';
import {createTakerCallCode, Taker, TakerFunction} from '../takers';

export function toTakerFunction(taker: Taker): TakerFunction {
  if (typeof taker === 'function') {
    return taker;
  }

  const bindings: Binding[] = [];
  const inputVar = createVar();
  const offsetVar = createVar();
  const resultVar = createVar();

  const code: Code = [
    'var ', resultVar, ';',
    createTakerCallCode(taker, inputVar, offsetVar, resultVar, bindings),
    'return ', resultVar,
  ];

  return compileFunction([inputVar, offsetVar], code, bindings);
}