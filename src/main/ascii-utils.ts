import {CharCode} from './CharCode';

export function lowerCharCodeAt(str: string, index: number): number {
  const charCode = str.charCodeAt(index);

  if (charCode >= CharCode['A'] && charCode <= CharCode['Z']) {
    return charCode - CharCode['A'] + CharCode['a'];
  }
  if (charCode >= CharCode['a'] && charCode <= CharCode['z']) {
    return charCode;
  }

  return charCode;
}

export function isAscii(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    if (str.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}
