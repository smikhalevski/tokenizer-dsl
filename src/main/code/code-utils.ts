import {Var} from './code-types';

/**
 * Creates the new variable placeholder.
 */
export function createVar(): Var {
  return Symbol();
}

export function inverseMap<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(Array.from(map).map(([k, v]) => [v, k]));
}

export function toArray<T>(t: T | T[]): T[] {
  return Array.isArray(t) ? t : [t];
}
