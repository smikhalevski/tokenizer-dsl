import {Binding, createVar, Var} from '../code';
import {CharCodeRange, CharCodeRangeTaker, createCharPredicateCode} from './char';
import {MaybeTaker} from './maybe';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, createTakerCallCode, toCharCodes} from './taker-utils';
import {CaseSensitiveTextTaker} from './text';

export interface AllOptions {

  /**
   * The minimum number of matches to consider success. Must be a finite non-negative number, otherwise set to 0.
   *
   * @default 0
   */
  minimumCount?: number;

  /**
   * The maximum number of matches to read. Must be a finite non-negative number, otherwise treated as unlimited.
   *
   * @default 0
   */
  maximumCount?: number;
}

/**
 * Creates taker that repeatedly takes chars using `taker`.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function all<C = any>(taker: Taker<C>, options: AllOptions = {}): Taker<C> {

  let {
    minimumCount = 0,
    maximumCount = 0,
  } = options;

  minimumCount = Math.max(minimumCount | 0, 0);
  maximumCount = Math.max(maximumCount | 0, 0); // 0 = Infinity

  if (maximumCount > 0 && minimumCount > maximumCount) {
    return never;
  }
  if (minimumCount === 0 && maximumCount === 1) {
    return new MaybeTaker(taker);
  }
  if (minimumCount === 1 && maximumCount === 1) {
    return taker;
  }
  if (taker === never || taker === none) {
    return taker;
  }
  if (taker instanceof CharCodeRangeTaker) {
    return new AllCharCodeRangeTaker(taker.charCodeRanges, minimumCount, maximumCount);
  }
  if (taker instanceof CaseSensitiveTextTaker) {
    return new AllCaseSensitiveTextTaker(taker.str, minimumCount, maximumCount);
  }
  if (taker instanceof RegexTaker) {
    return new AllRegexTaker(taker.re, minimumCount, maximumCount);
  }
  return new AllTaker(taker, minimumCount, maximumCount);
}

export class AllCharCodeRangeTaker implements TakerCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCodeRanges, minimumCount, maximumCount} = this;

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const charCodeVar = createVar();
    const takeCountVar = createVar();

    return createCodeBindings([
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      charCodeVar,
      minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
      ';',
      'while(', indexVar, '<', inputLengthVar,
      maximumCount ? ['&&', takeCountVar, '<', maximumCount] : '',
      '&&(',
      charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),',
      createCharPredicateCode(charCodeVar, charCodeRanges),
      ')){',
      minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
      '++', indexVar,
      '}',
      resultVar, '=',
      minimumCount ? [takeCountVar, '<', minimumCount, '?', NO_MATCH, ':', indexVar] : indexVar,
      ';'
    ]);
  }
}

export class AllCaseSensitiveTextTaker implements TakerCodegen {

  constructor(public str: string, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {str, minimumCount, maximumCount} = this;

    const strVar = createVar();
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takeCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
          ';',
          'while(',
          indexVar, '+', str.length, '<=', inputLengthVar,
          maximumCount ? ['&&', takeCountVar, '<', maximumCount] : '',
          toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', indexVar, '+', i, ')===', charCode]),
          '){',
          minimumCount || maximumCount ? ['++', takeCountVar, ';'] : '',
          indexVar, '+=', str.length,
          '}',
          resultVar, '=',
          minimumCount ? [takeCountVar, '<', minimumCount, '?', NO_MATCH, ':', indexVar] : indexVar,
          ';',
        ],
        [[strVar, str]],
    );
  }
}

export class AllRegexTaker implements TakerCodegen {

  re;

  constructor(re: RegExp, minimumCount: number, maximumCount: number) {
    this.re = RegExp(
        '(?:'
        + re.source
        + '){'
        + minimumCount
        + ','
        + (maximumCount || '')
        + '}',
        re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'),
    );
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const reVar = createVar();
    const arrVar = createVar();

    return createCodeBindings(
        [
          reVar, '.lastIndex=', offsetVar, ';',
          'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
          resultVar, '=', arrVar, '===null||', arrVar, '.index!==', offsetVar, '?', NO_MATCH, ':', reVar, '.lastIndex;',
        ],
        [[reVar, this.re]],
    );
  }
}

export class AllTaker<C> implements TakerCodegen {

  constructor(public taker: Taker<C>, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {taker, minimumCount, maximumCount} = this;

    const bindings: Binding[] = [];
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const takerResultVar = createVar();
    const takeCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, ',',
          takerResultVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', takeCountVar, '=0'] : '',
          ';',
          'do{',
          indexVar, '=', takerResultVar, ';',
          createTakerCallCode(taker, inputVar, indexVar, contextVar, takerResultVar, bindings),
          '}while(',
          takerResultVar, '>', indexVar,
          minimumCount || maximumCount ? ['&&++', takeCountVar, maximumCount ? '<' + maximumCount : ''] : '',
          ')',
          resultVar, '=',
          minimumCount ? [takeCountVar, '<', minimumCount, '?', NO_MATCH, ':'] : '',
          takerResultVar, '===', NO_MATCH, '?', indexVar, ':', takerResultVar,
          ';',
        ],
        bindings,
    );
  }
}
