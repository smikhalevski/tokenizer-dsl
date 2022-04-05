import {Code, Var} from '../code';
import {compileFunction, createVar} from '../code';
import {
  CharCodeRange,
  CharCodeRangeLike,
  InternalTaker,
  TakerFunction,
  TakerCodeFactory,
  TakerCodegen,
  Taker
} from './taker-types';

export function isInternalTaker<T extends InternalTaker>(taker: Taker | InternalTaker, type: T['type']): taker is T {
  return 'type' in taker && taker.type === type;
}

export function isTakerCodegen(taker: Taker | InternalTaker): taker is TakerCodegen {
  return 'factory' in taker;
}

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function toCharCodeRanges(values: CharCodeRangeLike[]): CharCodeRange[] {
  const ranges: CharCodeRange[] = [];

  for (const value of values) {
    if (typeof value === 'string') {
      ranges.push(...toCharCodes(value));
      continue;
    }
    if (typeof value === 'number') {
      ranges.push(value);
      continue;
    }
    ranges.push([toCharCode(value[0]), toCharCode(value[1])]);
  }
  return ranges;
}

export function toCharCode(value: string | number): number {
  return typeof value === 'string' ? value.charCodeAt(0) : value;
}

/**
 * Compiles an internal taker function of the given type.
 *
 * @param type The type of the taker.
 * @param factory The factory that returns the taker body code.
 * @param bindings The optional variable bindings available inside the taker function.
 * @returns The taker function.
 */
export function compileInternalTaker<T extends InternalTaker>(type: T['type'], factory: TakerCodeFactory, bindings?: [Var, unknown][]): T {
  const taker = toTaker({factory, bindings}) as T;

  taker.type = type;
  taker.factory = factory;
  taker.bindings = bindings;

  return taker;
}

export function toTaker(taker: Taker): TakerFunction {
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
