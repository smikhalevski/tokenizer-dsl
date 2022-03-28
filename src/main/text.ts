import {createCharCodeRangeTaker} from './char';
import {Code, compileInternalTaker, createVar} from './code';
import {none} from './none';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory} from './taker-types';
import {toCharCodes, toLowerCase, toUpperCase} from './taker-utils';

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
  type: InternalTakerType.CASE_SENSITIVE_TEXT;
  str: string;
}

export function createCaseSensitiveTextTaker(str: string): CaseSensitiveTextTaker {

  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', offsetVar, '+', str.length, '<=', inputVar, '.length',
    toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', offsetVar, i === 0 ? '' : '+' + i, ')===', charCode]),
    '?', offsetVar, '+', str.length, ':' + ResultCode.NO_MATCH + ';',
  ];

  const taker = compileInternalTaker<CaseSensitiveTextTaker>(InternalTakerType.CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);

  taker.str = str;

  return taker;
}

export interface CaseInsensitiveTextTaker extends InternalTaker {
  type: InternalTakerType.CASE_INSENSITIVE_TEXT;
  str: string;
  locales: string | string[] | undefined;
}

export function createCaseInsensitiveTextTaker(str: string, locales: string | string[] | undefined): CaseInsensitiveTextTaker {

  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const lowerCharCodes = toCharCodes(toLowerCase(str, locales));
    const upperCharCodes = toCharCodes(toUpperCase(str, locales));

    const lowerCharCount = lowerCharCodes.length;
    const upperCharCount = upperCharCodes.length;

    const minimumCharCount = Math.min(lowerCharCount, upperCharCount);
    const maximumCharCount = Math.max(lowerCharCount, upperCharCount);

    const code: Code[] = [
      'var ', charCodeVar, ';',
      resultVar, '=', offsetVar, '+', minimumCharCount - 1, '<', inputVar, '.length',
    ];

    for (let i = 0; i < maximumCharCount; ++i) {
      code.push(
          '&&(',
          charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, '++),',
          i < lowerCharCount ? [charCodeVar, '===', lowerCharCodes[i]] : '',
          i < upperCharCount ? [i < lowerCharCount ? '||' : '', charCodeVar, '===', upperCharCodes[i]] : '',
          ')',
      );
    }
    code.push('?', offsetVar, ':' + ResultCode.NO_MATCH, ';');

    return code;
  };

  const taker = compileInternalTaker<CaseInsensitiveTextTaker>(InternalTakerType.CASE_INSENSITIVE_TEXT, factory);

  taker.str = str;
  taker.locales = locales;

  return taker;
}
