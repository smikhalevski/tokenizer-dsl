import {Var} from './code-types';

/**
 * Creates the new variable placeholder.
 */
export function createVar(description?: string | number): Var {
  return Symbol(description);
}

export function isVar(v: unknown): v is Var {
  return typeof v === 'symbol';
}

export function inverseMap<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(Array.from(map).map(([k, v]) => [v, k]));
}

export function toArray<T>(t: T | T[]): T[] {
  return Array.isArray(t) ? t : [t];
}
