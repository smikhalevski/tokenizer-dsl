import {Code, createVar, Var} from '../code';
import {CharCodeRangeTaker} from './char';
import {none} from './none';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, toCharCodes} from './taker-utils';

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
    return new CaseInsensitiveTextTaker(str);
  }
  if (strLength === 1) {
    return new CharCodeRangeTaker([str.charCodeAt(0)]);
  }
  return new CaseSensitiveTextTaker(str);
}

export class CaseSensitiveTextTaker implements TakerCodegen {

  constructor(public str: string) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {str} = this;

    const strVar = createVar();

    return createCodeBindings(
        [
          resultVar, '=', offsetVar, '+', str.length, '<=', inputVar, '.length',
          toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', offsetVar, '+', i, ')===', charCode]),
          '?', offsetVar, '+', str.length, ':', NO_MATCH, ';',
        ],
        [[strVar, str]],
    );
  }
}

export class CaseInsensitiveTextTaker implements TakerCodegen {

  constructor(public str: string) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {str} = this;

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

    return createCodeBindings(code);
  }
}
