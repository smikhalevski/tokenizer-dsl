import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {CodeBindings, Taker, TakerFunction} from './taker-types';

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createTakerCallCode<C>(taker: Taker<C>, inputVar: Var, offsetVar: Var, contextVar: Var, returnVar: Var, bindings: Binding[]): Code {

  if ('factory' in taker) {
    const codeBindings = taker.factory(inputVar, offsetVar, contextVar, returnVar);

    if (codeBindings.bindings) {
      bindings.push(...codeBindings.bindings);
    }
    return codeBindings.code;
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
