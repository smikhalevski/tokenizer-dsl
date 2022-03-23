import {createCharCodeRangeTaker} from './char';
import {createTaker, createVar, js} from './js';
import {none} from './none';
import {InternalTaker, ResultCode, Taker, TakerCodeFactory, TakerType} from './taker-types';

export interface TextOptions {

  /**
   * If set to `true` then string comparison is case-insensitive.
   *
   * @default false
   */
  caseInsensitive?: boolean;

  /**
   * Locale that is used to match case-insensitive strings.
   */
  locales?: string | string[];
}

/**
 * Creates taker that reads a substring from the input.
 *
 * @param str The text to match.
 * @param options Taker options.
 * @see {@link char}
 */
export function text(str: string, options: TextOptions = {}): Taker {
  const {
    caseInsensitive = false,
    locales,
  } = options;

  const strLength = str.length;

  if (strLength === 0) {
    return none;
  }
  if (caseInsensitive && toLowerCase(str, locales) !== toUpperCase(str, locales)) {
    return createCaseInsensitiveTextTaker(str, locales);
  }
  if (strLength === 1) {
    return createCharCodeRangeTaker([str.charCodeAt(0)]);
  }
  return createCaseSensitiveTextTaker(str);
}

export interface CaseSensitiveTextTaker extends InternalTaker {
  __type: TakerType.CASE_SENSITIVE_TEXT;
  __str: string;
}

export function createCaseSensitiveTextTaker(str: string): CaseSensitiveTextTaker {

  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      resultVar, '=', inputVar, '.startsWith(', strVar, ',', offsetVar, ')',
      '?', offsetVar, '+', str.length,
      ':' + ResultCode.NO_MATCH,
      ';',
  );

  const taker = createTaker<CaseSensitiveTextTaker>(TakerType.CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);

  taker.__str = str;

  return taker;
}

export interface CaseInsensitiveTextTaker extends InternalTaker {
  __type: TakerType.CASE_INSENSITIVE_TEXT;
  __str: string;
  __locales: string | string[] | undefined;
}

export function createCaseInsensitiveTextTaker(str: string, locales: string | string[] | undefined): CaseInsensitiveTextTaker {

  const lowerCharCodes = toCharCodes(toLowerCase(str, locales));
  const upperCharCodes = toCharCodes(toUpperCase(str, locales));

  const lowerCharCount = lowerCharCodes.length;
  const upperCharCount = upperCharCodes.length;

  const charCount = Math.max(lowerCharCount, upperCharCount);

  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const node = js(
        'var ', charCodeVar, ';',
        resultVar, '=', offsetVar, '<', inputVar, '.length',
    );

    for (let i = 0; i < charCount; ++i) {
      node.push(
          '&&(',
          charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, '++),',
          i < lowerCharCount ? [charCodeVar, '===', lowerCharCodes[i]] : '',
          i < upperCharCount ? [i < lowerCharCount ? '||' : '', charCodeVar, '===', upperCharCodes[i]] : '',
          ')',
      );
    }
    return node.push('?', offsetVar, ':' + ResultCode.NO_MATCH, ';');
  };

  const taker = createTaker<CaseInsensitiveTextTaker>(TakerType.CASE_INSENSITIVE_TEXT, factory);

  taker.__str = str;
  taker.__locales = locales;

  return taker;
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
