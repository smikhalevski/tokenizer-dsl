export function stringifyBuiltinValue(value: any): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return JSON.stringify(value);
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (value instanceof RegExp) {
    return value.toString();
  }

  throw new Error('Cannot stringify value as an expression: ' + String(value));
}

export function inverseMap<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(Array.from(map).map(([k, v]) => [v, k]));
}
