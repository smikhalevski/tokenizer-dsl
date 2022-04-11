import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {CodeBindings, Taker, TakerCodegen, TakerFunction} from './taker-types';

export function isTakerCodegen(taker: Taker<any>): taker is TakerCodegen {
  return 'factory' in taker;
}

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createTakerCallCode<C>(taker: Taker<C>, inputVar: Var, offsetVar: Var, contextVar: Var, returnVar: Var, bindings: Binding[]): Code {
  if (isTakerCodegen(taker)) {
    const source = taker.factory(inputVar, offsetVar, contextVar, returnVar);
    if (source.bindings) {
      bindings.push(...source.bindings);
    }
    return source.code;
  }

  const takerVar = createVar();
  bindings.push([takerVar, taker]);
  return [returnVar, '=', takerVar, '(', inputVar, ',', offsetVar, ',', contextVar, ')', ';'];
}

export function createCodeBindings(code: Code, bindings?: Binding[]): CodeBindings {
  return {code, bindings};
}

export function toTakerFunction<C = void>(taker: Taker<C>): TakerFunction<C> {
  if (typeof taker === 'function') {
    return taker;
  }

  const bindings: Binding[] = [];
  const inputVar = createVar();
  const offsetVar = createVar();
  const contextVar = createVar();
  const resultVar = createVar();

  const code: Code = [
    'var ', resultVar, ';',
    createTakerCallCode(taker, inputVar, offsetVar, contextVar, resultVar, bindings),
    'return ', resultVar,
  ];

  return compileFunction([inputVar, offsetVar, contextVar], code, bindings);
}
