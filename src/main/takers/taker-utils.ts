import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {CodeBindings, Taker, TakerCodegen, TakerFunction} from './taker-types';

export function isTakerCodegen(taker: Taker): taker is TakerCodegen {
  return 'factory' in taker;
}

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createTakerCallCode(taker: Taker, inputVar: Var, offsetVar: Var, returnVar: Var, bindings: Binding[]): Code {
  if (isTakerCodegen(taker)) {
    const source = taker.factory(inputVar, offsetVar, returnVar);
    if (source.bindings) {
      bindings.push(...source.bindings);
    }
    return source.code;
  }

  const takerVar = createVar();
  bindings.push([takerVar, taker]);
  return [returnVar, '=', takerVar, '(', inputVar, ',', offsetVar, ')', ';'];
}

export function createCodeBindings(code: Code, bindings?: Binding[]): CodeBindings {
  return {code, bindings};
}

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
