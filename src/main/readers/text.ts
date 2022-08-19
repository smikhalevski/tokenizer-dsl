import { Code, CodeBindings, Var } from 'codedegen';
import { createVar, die } from '../utils';
import { CharCodeRangeReader } from './char';
import { none } from './none';
import { Reader, ReaderCodegen } from './reader-types';
import { createCodeBindings, toCharCodes } from './reader-utils';

export interface TextOptions {

  /**
   * If set to `true` then string comparison is case-insensitive.
   *
   * @default false
   */
  caseInsensitive?: boolean;
}

/**
 * Creates a reader that reads a substring from the input.
 *
 * @param str The text to match.
 * @param options Reader options.
 *
 * @see {@link char}
 */
export function text(str: string, options: TextOptions = {}): Reader<any> {

  const { caseInsensitive } = options;

  if (str.length === 0) {
    return none;
  }

  const strUpper = str.toUpperCase();
  const strLower = str.toLowerCase();

  if (caseInsensitive && strUpper !== strLower) {
    if (strUpper.length !== strLower.length) {
      die('Unsupported char');
    }
    return new CaseInsensitiveTextReader(str);
  }
  if (str.length === 1) {
    return new CharCodeRangeReader([str.charCodeAt(0)]);
  }
  return new CaseSensitiveTextReader(str);
}

export class CaseSensitiveTextReader implements ReaderCodegen {

  constructor(public str: string) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const { str } = this;

    return createCodeBindings([
      resultVar, '=', offsetVar, '+', str.length, '<=', inputVar, '.length',
      toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', offsetVar, '+', i, ')===', charCode]),
      '?', offsetVar, '+', str.length, ':-1;',
    ]);
  }
}

export class CaseInsensitiveTextReader implements ReaderCodegen {

  constructor(public str: string) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const { str } = this;

    const charCodeVar = createVar();

    const lowerCharCodes = toCharCodes(str.toLowerCase());
    const upperCharCodes = toCharCodes(str.toUpperCase());

    const charCount = lowerCharCodes.length;

    const code: Code[] = [
      'var ', charCodeVar, ';',
      resultVar, '=', offsetVar, '+', charCount, '<=', inputVar, '.length',
    ];

    for (let i = 0; i < charCount; ++i) {

      const lowerCharCode = lowerCharCodes[i];
      const upperCharCode = upperCharCodes[i];

      if (lowerCharCode === upperCharCode) {
        code.push('&&', inputVar, '.charCodeAt(', offsetVar, '+', i, ')===', lowerCharCode);
      } else {
        code.push(
          '&&(',
          charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, '+', i, '),',
          charCodeVar, '===', lowerCharCode, '||', charCodeVar, '===', upperCharCode,
          ')',
        );
      }
    }
    code.push('?', offsetVar, '+', charCount, ':-1;');

    return createCodeBindings(code);
  }
}
