import {Code, createVar} from '../code';
import {createCharCodeRangeTaker} from './char';
import {CASE_INSENSITIVE_TEXT_TYPE, CASE_SENSITIVE_TEXT_TYPE, InternalTaker} from './internal-taker-types';
import {none} from './none';
import {NO_MATCH, Taker} from './taker-types';
import {toCharCode, toCharCodes} from './taker-utils';

export interface TextOptions {

  /**
   * If set to `true` then string comparison is case-insensitive.
   *
   * @default false
   */
  caseInsensitive?: boolean;
}

/**
 * Creates taker that reads a substring from the input.
 *
 * @param str The text to match.
 * @param options Taker options.
 * @see {@link char}
 */
export function text(str: string, options: TextOptions = {}): Taker {

  const {caseInsensitive = false} = options;

  const strLength = str.length;

  if (strLength === 0) {
    return none;
  }

  const strUpper = str.toUpperCase();
  const strLower = str.toLowerCase();

  if (caseInsensitive && strUpper !== strLower) {
    if (strUpper.length !== strLower.length) {
      throw new Error('Unsupported char');
    }
    return createCaseInsensitiveTextTaker(str);
  }
  if (strLength === 1) {
    return createCharCodeRangeTaker([toCharCode(str)]);
  }
  return createCaseSensitiveTextTaker(str);
}

export interface CaseSensitiveTextTaker extends InternalTaker {
  type: CASE_SENSITIVE_TEXT_TYPE;
  str: string;
}

export function createCaseSensitiveTextTaker(str: string): CaseSensitiveTextTaker {

  const strVar = createVar();

  return {
    type: CASE_SENSITIVE_TEXT_TYPE,
    bindings: [[strVar, str]],
    str,

    factory(inputVar, offsetVar, resultVar) {
      return [
        resultVar, '=', offsetVar, '+', str.length, '<=', inputVar, '.length',
        toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', offsetVar, i > 0 ? '+' + i : '', ')===', charCode]),
        '?', offsetVar, '+', str.length, ':', NO_MATCH, ';',
      ];
    },
  };
}

export interface CaseInsensitiveTextTaker extends InternalTaker {
  type: CASE_INSENSITIVE_TEXT_TYPE;
  str: string;
}

export function createCaseInsensitiveTextTaker(str: string): CaseInsensitiveTextTaker {
  return {
    type: CASE_INSENSITIVE_TEXT_TYPE,
    str,

    factory(inputVar, offsetVar, resultVar) {

      const charCodeVar = createVar();

      const lowerCharCodes = toCharCodes(str.toLowerCase());
      const upperCharCodes = toCharCodes(str.toUpperCase());

      const charCount = lowerCharCodes.length;

      const code: Code[] = [
        'var ', charCodeVar, ';',
        resultVar, '=', offsetVar, '+', charCount - 1, '<', inputVar, '.length',
      ];

      for (let i = 0; i < charCount; ++i) {

        const lowerCharCode = lowerCharCodes[i];
        const upperCharCode = upperCharCodes[i];

        if (lowerCharCode === upperCharCode) {
          code.push('&&', inputVar, '.charCodeAt(', offsetVar, '++)===', lowerCharCode);
        } else {
          code.push(
              '&&(',
              charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, '++),',
              charCodeVar, '===', lowerCharCode, '||', charCodeVar, '===', upperCharCode,
              ')',
          );
        }
      }
      code.push('?', offsetVar, ':', NO_MATCH, ';');

      return code;
    },
  };
}
