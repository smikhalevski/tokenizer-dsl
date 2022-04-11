import {Binding, createVar, Var} from '../code';
import {CharCodeRange, CharCodeRangeTaker, createCharPredicateCode} from './char';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, createTakerCallCode} from './taker-utils';
import {CaseSensitiveTextTaker} from './text';

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
export function until<C = any>(taker: Taker<C>, options: UntilOptions = {}): Taker<C> {

  const {inclusive = false} = options;

  if (taker === never || taker === none) {
    return taker;
  }
  if (taker instanceof RegexTaker) {
    return new UntilRegexTaker(taker.re, inclusive);
  }
  if (taker instanceof CharCodeRangeTaker) {
    const {charCodeRanges} = taker;

    if (charCodeRanges.length === 1 && typeof charCodeRanges[0] === 'number') {
      return new UntilCaseSensitiveTextTaker(String.fromCharCode(charCodeRanges[0]), inclusive);
    }
    return new UntilCharCodeRangeTaker(charCodeRanges, inclusive);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new UntilCaseSensitiveTextTaker(taker.str, inclusive);
  }
  return new UntilTaker(taker, inclusive);
}

export class UntilCharCodeRangeTaker implements TakerCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

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
      '&&(', charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),!(', createCharPredicateCode(charCodeVar, this.charCodeRanges), '))',
      ')++', indexVar, ';',
      resultVar, '=', indexVar, '===', inputLengthVar, '?', NO_MATCH, ':', indexVar, this.inclusive ? '+1;' : ';',
    ]);
  }
}

export class UntilCaseSensitiveTextTaker implements TakerCodegen {

  constructor(public str: string, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

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

export class UntilRegexTaker implements TakerCodegen {

  re;

  constructor(re: RegExp, public inclusive: boolean) {
    this.re = RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

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

export class UntilTaker<C> implements TakerCodegen {

  constructor(public taker: Taker<C>, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takerResultVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, '=', offsetVar, ',',
          takerResultVar, '=', NO_MATCH, ';',
          'while(', indexVar, '<', inputLengthVar, '&&', takerResultVar, '===', NO_MATCH, '){',
          createTakerCallCode(this.taker, inputVar, indexVar, contextVar, takerResultVar, bindings),
          '++', indexVar,
          '}',
          resultVar, '=', takerResultVar, '<', 0, '?', takerResultVar, ':', this.inclusive ? takerResultVar : [indexVar, '-1'], ';',
        ],
        bindings,
    );
  }
}
