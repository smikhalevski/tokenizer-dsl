import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
import {MaybeReader} from './maybe';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

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
