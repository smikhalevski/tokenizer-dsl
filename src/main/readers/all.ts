import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, createCharPredicateCode} from './char';
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

  /**
   * The positive number of iterations [unrolled in a loop](https://en.wikipedia.org/wiki/Loop_unrolling). Only
   * applicable when {@link maximumCount} is omitted. The more iterations are unrolled the more bloated the generated
   * code becomes.
   */
  unrollingCount?: number;
}

/**
 * Creates a reader that repeatedly reads chars using `reader`.
 *
 * @param reader The reader that reads chars.
 * @param options Reader options.
 *
 * @template Context The context passed by tokenizer.
 */
export function all<Context = any, Error = never>(reader: Reader<Context, Error>, options: AllOptions = {}): Reader<Context, Error> {

  let {
    minimumCount = 0,
    maximumCount = 0,
    unrollingCount = 1,
  } = options;

  minimumCount = Math.max(minimumCount | 0, 0);
  maximumCount = Math.max(maximumCount | 0, 0); // 0 = Infinity
  unrollingCount = Math.max(unrollingCount | 0, 1);

  if (maximumCount && minimumCount > maximumCount) {
    return never;
  }
  if (minimumCount === 1 && maximumCount === 1 || reader === never || reader === none) {
    return reader;
  }
  // if (reader instanceof CharCodeRangeReader) {
  //   return new AllCharCodeRangeReader(reader.charCodeRanges, minimumCount, maximumCount, unrollingCount);
  // }
  return new AllReader(reader, minimumCount, maximumCount, unrollingCount);
}

export class AllCharCodeRangeReader implements ReaderCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public minimumCount: number, public maximumCount: number, public unrollingCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCodeRanges, minimumCount, maximumCount} = this;

    const indexVar = createVar();
    const inputLengthVar = createVar();
    const charCodeVar = createVar();

    const code: Code[] = [
      'var ',
      indexVar, '=', offsetVar, ',',
      inputLengthVar, '=', inputVar, '.length,',
      charCodeVar, ';',

      resultVar, '=', minimumCount > 0 ? NO_MATCH : indexVar, ';',
    ];

    const predicateCode = createCharPredicateCode(charCodeVar, charCodeRanges);

    // If the maximum count is limited then there's no loop at all
    const count = maximumCount > 0 ? maximumCount : minimumCount + this.unrollingCount + 1;

    for (let i = 0; i < count; ++i) {

      // Prevent out-of-bounds reads
      code.push('if(', indexVar, '<', inputLengthVar, '){');

      // Intermediate iteration
      if (i < count - 1) {
        code.push(
            charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
            'if(', predicateCode, '){',
            i < minimumCount - 1 ? '' : [resultVar, '='], '++', indexVar, ';',
        );
        continue;
      }

      // The last iteration when the maximum count is limited
      if (maximumCount > 0) {
        code.push(
            charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
            'if(', predicateCode, ')', resultVar, '=', indexVar, '+1;',
        );
        continue;
      }

      // The last iteration when the maximum count is unlimited and the minimum count was read
      code.push(
          resultVar, '=', indexVar, ';',
          'do{',
          charCodeVar, '=', inputVar, '.charCodeAt(', resultVar, ')',
          '}while((', predicateCode, ')&&++', resultVar, '<', inputLengthVar, ');'
      );
    }

    code.push('}'.repeat(count * 2 - 1));

    return createCodeBindings(code);
  }
}

export class AllReader<Context, Error> implements ReaderCodegen {

  constructor(public reader: Reader<Context, Error>, public minimumCount: number, public maximumCount: number, public unrollingCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {reader, minimumCount, maximumCount} = this;

    const indexVar = createVar();
    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    const code: Code[] = [
      resultVar, '=', minimumCount === 0 ? offsetVar : NO_MATCH, ';',
      'var ',
      minimumCount > 1 ? [indexVar, '=', offsetVar, ','] : '',
      readerResultVar, ';',
    ];

    const count = Math.max(minimumCount, maximumCount);

    for (let i = 0; i < count; ++i) {
      const nextOffsetVar = i < minimumCount - 1 ? indexVar : resultVar;

      code.push(
          createReaderCallCode(reader, inputVar, i === 0 ? offsetVar : nextOffsetVar, contextVar, readerResultVar, bindings),
          'if(typeof ', readerResultVar, '!=="number"){', resultVar, '=', readerResultVar, '}else ',
          'if(', readerResultVar, '>', i === 0 ? offsetVar : nextOffsetVar, '){',
          nextOffsetVar, '=', readerResultVar, ';',
      );
    }

    if (maximumCount === 0) {
      code.push('do{');
      for (let i = 0; i < this.unrollingCount; ++i) {
        code.push(
            createReaderCallCode(reader, inputVar, resultVar, contextVar, readerResultVar, bindings),
            'if(typeof ', readerResultVar, '!=="number"){', resultVar, '=', readerResultVar, ';break}',
            'if(', readerResultVar, '<=', resultVar, ')break;',
            resultVar, '=', readerResultVar, ';',
        );
      }
      code.push('}while(true)');
    }

    code.push('}'.repeat(count));

    return createCodeBindings(code, bindings);
  }
}
