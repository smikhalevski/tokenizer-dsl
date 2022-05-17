import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
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
  return new AllReader(reader, minimumCount, maximumCount, toInteger(unrollCount, 5, 1));
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
