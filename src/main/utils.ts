import { Var } from 'codedegen';
import { ExternalValue } from './externalValue';

export function die(message?: string): never {
  throw new Error(message);
}

export function toInteger(value: number | undefined, defaultValue?: number, minimumValue?: number): number {
  return Math.max((value || defaultValue || 0) | 0, minimumValue || 0);
}

export function createVar(name?: string): Var {
  return { type: 'var', name };
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isExternalValue(value: unknown): value is ExternalValue {
  return value instanceof ExternalValue;
}

export function isCallable(value: unknown): value is Function | ExternalValue {
  return isFunction(value) || isExternalValue(value);
}
