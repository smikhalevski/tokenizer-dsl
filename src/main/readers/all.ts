import {Binding, createVar, Var} from '../code';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
import {MaybeReader} from './maybe';
import {never} from './never';
import {none} from './none';
import {RegexReader} from './regex';
import {CodeBindings, NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode, toCharCodes} from './reader-utils';
import {CaseSensitiveTextReader} from './text';

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
 * Creates reader that repeatedly reads chars using `reader`.
 *
 * @param reader The reader that reads chars.
 * @param options Reader options.
 */
export function all<C = any>(reader: Reader<C>, options: AllOptions = {}): Reader<C> {

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
    return new MaybeReader(reader);
  }
  if (minimumCount === 1 && maximumCount === 1) {
    return reader;
  }
  if (reader === never || reader === none) {
    return reader;
  }
  if (reader instanceof CharCodeRangeReader) {
    return new AllCharCodeRangeReader(reader.charCodeRanges, minimumCount, maximumCount);
  }
  if (reader instanceof CaseSensitiveTextReader) {
    return new AllCaseSensitiveTextReader(reader.str, minimumCount, maximumCount);
  }
  if (reader instanceof RegexReader) {
    return new AllRegexReader(reader.re, minimumCount, maximumCount);
  }
  return new AllReader(reader, minimumCount, maximumCount);
}

export class AllCharCodeRangeReader implements ReaderCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCodeRanges, minimumCount, maximumCount} = this;

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const charCodeVar = createVar();
    const readCountVar = createVar();

    return createCodeBindings([
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      charCodeVar,
      minimumCount || maximumCount ? [',', readCountVar, '=0'] : '',
      ';',
      'while(', indexVar, '<', inputLengthVar,
      maximumCount ? ['&&', readCountVar, '<', maximumCount] : '',
      '&&(',
      charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),',
      createCharPredicateCode(charCodeVar, charCodeRanges),
      ')){',
      minimumCount || maximumCount ? ['++', readCountVar, ';'] : '',
      '++', indexVar,
      '}',
      resultVar, '=',
      minimumCount ? [readCountVar, '<', minimumCount, '?', NO_MATCH, ':', indexVar] : indexVar,
      ';'
    ]);
  }
}

export class AllCaseSensitiveTextReader implements ReaderCodegen {

  constructor(public str: string, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {str, minimumCount, maximumCount} = this;

    const strVar = createVar();
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const readCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', readCountVar, '=0'] : '',
          ';',
          'while(',
          indexVar, '+', str.length, '<=', inputLengthVar,
          maximumCount ? ['&&', readCountVar, '<', maximumCount] : '',
          toCharCodes(str).map((charCode, i) => ['&&', inputVar, '.charCodeAt(', indexVar, '+', i, ')===', charCode]),
          '){',
          minimumCount || maximumCount ? ['++', readCountVar, ';'] : '',
          indexVar, '+=', str.length,
          '}',
          resultVar, '=',
          minimumCount ? [readCountVar, '<', minimumCount, '?', NO_MATCH, ':', indexVar] : indexVar,
          ';',
        ],
        [[strVar, str]],
    );
  }
}

export class AllRegexReader implements ReaderCodegen {

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

export class AllReader<C> implements ReaderCodegen {

  constructor(public reader: Reader<C>, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {reader, minimumCount, maximumCount} = this;

    const bindings: Binding[] = [];
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const readerResultVar = createVar();
    const readCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, ',',
          readerResultVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', readCountVar, '=0'] : '',
          ';',
          'do{',
          indexVar, '=', readerResultVar, ';',
          createReaderCallCode(reader, inputVar, indexVar, contextVar, readerResultVar, bindings),
          '}while(',
          readerResultVar, '>', indexVar,
          minimumCount || maximumCount ? ['&&++', readCountVar, maximumCount ? '<' + maximumCount : ''] : '',
          ')',
          resultVar, '=',
          minimumCount ? [readCountVar, '<', minimumCount, '?', NO_MATCH, ':'] : '',
          readerResultVar, '===', NO_MATCH, '?', indexVar, ':', readerResultVar,
          ';',
        ],
        bindings,
    );
  }
}