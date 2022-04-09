import {Code, compileFunction, createVar} from '../code';
import {Taker, TakerFunction} from '../takers';

export function toTakerFunction(taker: Taker): TakerFunction {
  if (typeof taker === 'function') {
    return taker;
  }

  const {factory, bindings} = taker;

  const inputVar = createVar();
  const offsetVar = createVar();
  const resultVar = createVar();

  const code: Code = [
    'var ', resultVar, ';',
    factory(inputVar, offsetVar, resultVar),
    'return ', resultVar,
  ];

  return compileFunction([inputVar, offsetVar], code, bindings);
}
