import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
import {die, toInteger} from '../utils';
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
   * The positive number of read iterations that are [unrolled in a loop](https://en.wikipedia.org/wiki/Loop_unrolling).
   *
   * Only applicable when {@link maximumCount} is unlimited.
   *
   * The best number of unrolled iterations is equal to the median number of matches that are expected.
   */
  unrollCount?: number;
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
    minimumCount,
    maximumCount,
    unrollCount,
  } = options;

  minimumCount = toInteger(minimumCount);
  maximumCount = toInteger(maximumCount); // 0 = Infinity

  if (maximumCount !== 0 && minimumCount > maximumCount) {
    die('Maximum must be greater of equal than minimum');
  }
  if (minimumCount === 1 && maximumCount === 1 || reader === never || reader === none) {
    return reader;
  }
  if (reader instanceof CharCodeRangeReader) {
    return new AllCharCodeRangeReader(reader.charCodeRanges, minimumCount, maximumCount, toInteger(unrollCount, 1, 1));
  }
  return new AllReader(reader, minimumCount, maximumCount, toInteger(unrollCount, 1, 1));
}

export class AllCharCodeRangeReader implements ReaderCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public minimumCount: number, public maximumCount: number, public unrollCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCodeRanges, minimumCount, maximumCount, unrollCount} = this;

    const indexVar = createVar();
    const inputLengthVar = createVar();
    const charCodeVar = createVar();

    const code: Code[] = [
      resultVar, '=', minimumCount > 0 ? NO_MATCH : offsetVar, ';',

      'var ',
      indexVar, '=', offsetVar, ',',
      inputLengthVar, '=', inputVar, '.length,',
      charCodeVar, ';',
    ];

    const predicateCode = createCharPredicateCode(charCodeVar, charCodeRanges);

    const count = Math.max(minimumCount, maximumCount);

    if (minimumCount > 0) {
      code.push('if(', offsetVar, '+', minimumCount, '<=', inputLengthVar, '){');
    }

    for (let i = 0; i < count; ++i) {
      code.push(
          i < minimumCount ? '' : ['if(', indexVar, '<', inputLengthVar, '){'],
          charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
          'if(', predicateCode, '){',
          i < minimumCount - 1 ? '' : [resultVar, '='], '++', indexVar, ';',
      );
    }

    if (maximumCount === 0) {
      code.push('do{');

      if (unrollCount > 1) {
        code.push('if(', resultVar, '+', unrollCount, '>=', inputLengthVar, '){');
        for (let i = 0; i < unrollCount; ++i) {
          code.push(
              charCodeVar, '=', inputVar, '.charCodeAt(', resultVar, ');',
              'if(!(', predicateCode, '))break;',
              '++', resultVar, ';',
          );
        }
        code.push('continue}');
      }

      for (let i = 0; i < unrollCount; ++i) {
        code.push(
            'if(', resultVar, '>=', inputLengthVar, ')break;',
            charCodeVar, '=', inputVar, '.charCodeAt(', resultVar, ');',
            'if(!(', predicateCode, '))break;',
            '++', resultVar, ';',
        );
      }
      code.push('}while(true)');
    }

    code.push('}'.repeat(count * 2 + (minimumCount > 0 ? 1 - minimumCount : 0)));

    return createCodeBindings(code);
  }
}

export class AllReader<Context, Error> implements ReaderCodegen {

  constructor(public reader: Reader<Context, Error>, public minimumCount: number, public maximumCount: number, public unrollCount: number) {
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
      for (let i = 0; i < this.unrollCount; ++i) {
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
