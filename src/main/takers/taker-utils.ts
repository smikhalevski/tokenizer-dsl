import {Binding, Code, compileFunction, createVar} from '../code';
import {InternalTaker, Taker, TakerCodeFactory, TakerCodegen, TakerLike} from './taker-types';

export function isInternalTaker<T extends InternalTaker>(taker: TakerLike | InternalTaker, type: T['type']): taker is T {
  return 'type' in taker && taker.type === type;
}

export function isTakerCodegen(taker: TakerLike | InternalTaker): taker is TakerCodegen {
  return 'factory' in taker;
}

export function toLowerCase(str: string, locales: string | string[] | undefined): string {
  return locales ? str.toLocaleLowerCase(locales) : str.toLowerCase();
}

export function toUpperCase(str: string, locales: string | string[] | undefined): string {
  return locales ? str.toLocaleUpperCase(locales) : str.toUpperCase();
}

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

/**
 * Compiles an internal taker function of the given type.
 *
 * @param type The type of the taker.
 * @param factory The factory that returns the taker body code.
 * @param bindings The optional variable bindings available inside the taker function.
 * @returns The taker function.
 */
export function compileInternalTaker<T extends InternalTaker>(type: T['type'], factory: TakerCodeFactory, bindings?: Binding[]): T {
  const taker = toTaker({factory, bindings}) as T;

  taker.type = type;
  taker.factory = factory;
  taker.bindings = bindings;

  return taker;
}

export function toTaker(taker: TakerLike): Taker {
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

  return compileFunction([inputVar, offsetVar, resultVar], code, bindings);
}
