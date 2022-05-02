import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
import {MaybeReader} from './maybe';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode, toCharCodes} from './reader-utils';
import {RegexReader} from './regex';
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
 * Creates a reader that repeatedly reads chars using `reader`.
 *
 * @param reader The reader that reads chars.
 * @param options Reader options.
 *
 * @template Context The context passed by tokenizer.
 */
export function all<Context = any>(reader: Reader<Context>, options: AllOptions = {}): Reader<Context> {

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

    const charCodeVar = createVar();
    const indexVar = createVar();

    const unwoundCount = maximumCount || Math.max(minimumCount, 10);

    const code: Code[] = [
      'var ', charCodeVar, ',',
      indexVar, '=', offsetVar, ';',
      resultVar, '=', minimumCount ? NO_MATCH : indexVar, ';',
    ];

    for (let i = 0; i < unwoundCount; ++i) {
      code.push(
          charCodeVar, '=', inputVar, '.charCodeAt(', minimumCount ? indexVar : resultVar, ');',
          'if(', createCharPredicateCode(charCodeVar, charCodeRanges), '){++', minimumCount ? indexVar : resultVar, ';',
          minimumCount && i >= minimumCount - 1 ? [resultVar, '=', indexVar, ';'] : '',
      );
    }
    if (!maximumCount) {
      code.push(
          charCodeVar, '=', inputVar, '.charCodeAt(', resultVar, ');',
          'while(', createCharPredicateCode(charCodeVar, charCodeRanges), '){',
          '++', resultVar, ';',
          charCodeVar, '=', inputVar, '.charCodeAt(', resultVar, ');',
          '}',
      );
    }
    code.push('}'.repeat(unwoundCount));

    return createCodeBindings(code);
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

    return createCodeBindings(
        [
          reVar, '.lastIndex=', offsetVar, ';',
          resultVar, '=', reVar, '.test(', inputVar, ')?', reVar, '.lastIndex:', NO_MATCH, ';',
        ],
        [[reVar, this.re]],
    );
  }
}

export class AllReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {reader, minimumCount, maximumCount} = this;

    const bindings: Binding[] = [];
    const indexVar = createVar();
    const readerResultVar = createVar();
    const readCountVar = createVar();

    return createCodeBindings(
        [
          'var ',
          indexVar, ',',
          readerResultVar, '=', offsetVar,
          minimumCount || maximumCount ? [',', readCountVar, '=0'] : '',
          ';',
          'do{',

          // Ensure that we actually use a numeric result
          indexVar, '=', readerResultVar, '/1;',
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
