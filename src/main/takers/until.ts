import {Binding, createVar, Var} from '../code';
import {CHAR_CODE_RANGE_TYPE, CharCodeRangeTaker, createCharCodePredicate} from './char';
import {never} from './never';
import {none} from './none';
import {REGEX_TYPE, RegexTaker} from './regex';
import {CharCodeRange, InternalTaker, NO_MATCH, CodeBindings, Taker} from './taker-types';
import {createCodeBindings, createTakerType, createTakerCall, isInternalTaker} from './taker-utils';
import {CASE_SENSITIVE_TEXT_TYPE, CaseSensitiveTextTaker} from './text';

export interface UntilOptions {

  /**
   * If set to `true` then chars matched by `taker` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;
}

/**
 * Creates taker that takes chars until `taker` matches.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function until(taker: Taker, options: UntilOptions = {}): Taker {

  const {inclusive = false} = options;

  if (taker === never || taker === none) {
    return taker;
  }
  if (isInternalTaker<RegexTaker>(REGEX_TYPE, taker)) {
    return new UntilRegexTaker(taker.re, inclusive);
  }
  if (isInternalTaker<CharCodeRangeTaker>(CHAR_CODE_RANGE_TYPE, taker)) {
    const {charCodeRanges} = taker;

    if (charCodeRanges.length === 1 && typeof charCodeRanges[0] === 'number') {
      return new UntilCaseSensitiveTextTaker(String.fromCharCode(charCodeRanges[0]), inclusive);
    }
    return new UntilCharCodeRangeTaker(charCodeRanges, inclusive);
  }
  if (isInternalTaker<CaseSensitiveTextTaker>(CASE_SENSITIVE_TEXT_TYPE, taker)) {
    return new UntilCaseSensitiveTextTaker(taker.str, inclusive);
  }
  return new UntilGenericTaker(taker, inclusive);
}

export const UNTIL_CASE_SENSITIVE_TEXT_TYPE = createTakerType();
export const UNTIL_CHAR_CODE_RANGE_TYPE = createTakerType();
export const UNTIL_REGEX_TYPE = createTakerType();
export const UNTIL_GENERIC_TYPE = createTakerType();

export class UntilCharCodeRangeTaker implements InternalTaker {

  readonly type = UNTIL_CHAR_CODE_RANGE_TYPE;

  constructor(public charCodeRanges: CharCodeRange[], public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const charCodeVar = createVar();

    return createCodeBindings([
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      charCodeVar,
      ';',
      'while(', indexVar, '<', inputLengthVar,
      '&&(', charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),!(', createCharCodePredicate(charCodeVar, this.charCodeRanges), '))',
      ')++', indexVar, ';',
      resultVar, '=', indexVar, '===', inputLengthVar, '?', NO_MATCH, ':', indexVar, this.inclusive ? '+1;' : ';',
    ]);
  }
}

export class UntilCaseSensitiveTextTaker implements InternalTaker {

  readonly type = UNTIL_CASE_SENSITIVE_TEXT_TYPE;

  constructor(public str: string, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {

    const strVar = createVar();
    const indexVar = createVar();

    return createCodeBindings(
        [
          'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
          resultVar, '=', indexVar, '===-1?', NO_MATCH, ':', indexVar, this.inclusive ? '+' + this.str.length : '', ';',
        ],
        [[strVar, this.str]],
    );
  }
}

export class UntilRegexTaker implements InternalTaker {

  readonly type = UNTIL_REGEX_TYPE;
  re;

  constructor(re: RegExp, public inclusive: boolean) {
    this.re = RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {

    const reVar = createVar();
    const arrVar = createVar();

    return createCodeBindings(
        [
          reVar, '.lastIndex=', offsetVar, ';',
          'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
          resultVar, '=', arrVar, '===null?', NO_MATCH, ':', this.inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'], ';',
        ],
        [[reVar, this.re]],
    );
  }
}

export class UntilGenericTaker implements InternalTaker {

  readonly type = UNTIL_GENERIC_TYPE;

  constructor(public taker: Taker, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takerResultVar = createVar();

    return createCodeBindings([
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      takerResultVar, '=', NO_MATCH, ';',
      'while(', indexVar, '<', inputLengthVar, '&&', takerResultVar, '===', NO_MATCH, '){',
      createTakerCall(this.taker, inputVar, indexVar, takerResultVar, bindings),
      '++', indexVar,
      '}',
      resultVar, '=', takerResultVar, '<', 0, '?', takerResultVar, ':', this.inclusive ? takerResultVar : [indexVar, '-1'], ';',
    ]);
  }
}
