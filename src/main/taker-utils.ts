import {InternalTaker, TakerCodegen, TakerLike} from './taker-types';

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
