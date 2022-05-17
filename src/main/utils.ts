export function die(message?: string): never {
  throw new Error(message);
}

export function toInteger(value: number | undefined, defaultValue?: number, minimumValue?: number): number {
  return Math.max((value || defaultValue || 0) | 0, minimumValue || 0);
}
