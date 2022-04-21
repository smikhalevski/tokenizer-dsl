/**
 * Encodes a non-negative integer as a string of lower ASCII alpha characters (a-z).
 *
 * ```ts
 * encodeAlpha(0); // → 'a'
 *
 * encodeAlpha(100); // → 'cw'
 * ```
 *
 * @param value The number to encode.
 * @returns The value encoded as a string.
 */
export function encodeAlpha(value: number): string {
  let str = '';

  do {
    str = String.fromCharCode(97 /*a*/ + value % 26) + str;
    value /= 26;
  } while (--value >= 0);

  return str;
}
