import {Binding, Code, createVar, Var} from '../code';
import {InternalTaker, Qqq, Taker, TakerCodegen} from './taker-types';

export function isInternalTaker<T extends InternalTaker>(type: T['type'], taker: Taker | InternalTaker): taker is T {
  return 'type' in taker && taker.type === type;
}

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

export function createTakerCall(taker: Taker, inputVar: Var, offsetVar: Var, returnVar: Var, bindings: Binding[]): Code {
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

export function createQqq(code: Code, bindings?: Binding[]): Qqq {
  return {code, bindings};
}

export function createSymbol() {
  return Symbol();
}