import { Var } from 'codedegen';

export function die(message?: string): never {
  throw new Error(message);
}

export function toInteger(value: number | undefined, defaultValue?: number, minimumValue?: number): number {
  return Math.max((value || defaultValue || 0) | 0, minimumValue || 0);
}

export function createVar(): Var {
  return Symbol();
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}
