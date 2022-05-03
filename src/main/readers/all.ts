import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
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
   * The number of iterations [to unroll from a loop](https://en.wikipedia.org/wiki/Loop_unrolling) when
   * {@link maximumCount} is omitted.
   *
   * @default 5
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
export function all<Context = any>(reader: Reader<Context>, options: AllOptions = {}): Reader<Context> {

  let {
    minimumCount = 0,
    maximumCount = 0,
    unrollingCount = 5,
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
  if (reader instanceof CharCodeRangeReader) {
    return new AllCharCodeRangeReader(reader.charCodeRanges, minimumCount, maximumCount, unrollingCount);
  }
  return new AllReader(reader, minimumCount, maximumCount, unrollingCount);
}

export class AllCharCodeRangeReader implements ReaderCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public minimumCount: number, public maximumCount: number, public unrollingCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {charCodeRanges, minimumCount, maximumCount, unrollingCount} = this;

    const inputLengthVar = createVar();
    const charCodeVar = createVar();

    const code: Code[] = [
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      charCodeVar, ';',
    ];

    if (minimumCount !== 0) {
      // Check the required minimum of chars before proceeding
      // if (offset + minimumCount < input.length && (charCode = input.charCodeAt(offset + i), charPredicate(charCode)) && … )
      code.push(
          resultVar, '=', NO_MATCH, ';',
          'if(', offsetVar, '+', minimumCount - 1, '<', inputLengthVar,
      );
      for (let i = 0; i < minimumCount; ++i) {
        code.push('&&(', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, '+', i, '),', createCharPredicateCode(charCodeVar, charCodeRanges), ')');
      }
      code.push('){', resultVar, '=', offsetVar, '+', minimumCount, ';');
    } else {
      code.push(resultVar, '=', offsetVar, ';');
    }

    const remainingCount = Math.max(0, maximumCount - minimumCount);

    if (maximumCount === 0 || remainingCount !== 0) {
      // Loop is removed if maximum count is known beforehand
      // (result < input.length && (charCode = input.charCodeAt(result), charPredicate(charCode)) && ++result < input.length && …) ++result;
      code.push(maximumCount !== 0 ? 'if(' : 'while(');
      for (let i = 0; i < (remainingCount || unrollingCount); ++i) {
        code.push(i === 0 ? '' : '&&++', resultVar, '<', inputLengthVar, '&&(', charCodeVar, '=', inputVar, '.charCodeAt(', resultVar, '),', createCharPredicateCode(charCodeVar, charCodeRanges), ')');
      }
      code.push(')++', resultVar, ';');
    }

    if (minimumCount !== 0) {
      code.push('}');
    }

    return createCodeBindings(code);
  }
}

export class AllReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>, public minimumCount: number, public maximumCount: number, public unrollingCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {reader, minimumCount, maximumCount} = this;

    const bindings: Binding[] = [];
    const indexVar = createVar();
    const readerResultVar = createVar();

    const unwoundCount = maximumCount || Math.max(minimumCount, 10);

    const code: Code[] = [
      'var ', readerResultVar, ',',
      indexVar, '=', offsetVar, ';',
      resultVar, '=', minimumCount ? NO_MATCH : indexVar, ';',
    ];

    for (let i = 0; i < unwoundCount; ++i) {
      code.push(
          createReaderCallCode(reader, inputVar, indexVar, contextVar, readerResultVar, bindings),
          'if(', readerResultVar, '>', indexVar, '){',
          indexVar, '=', readerResultVar, ';',
          !minimumCount || i >= minimumCount - 1 ? [resultVar, '=', indexVar, ';'] : '',
      );
    }
    if (!maximumCount) {
      code.push(
          createReaderCallCode(reader, inputVar, resultVar, contextVar, readerResultVar, bindings),
          'while(', readerResultVar, '>', resultVar, '){',
          resultVar, '=', readerResultVar, ';',
          '}',
      );
    }
    code.push('}'.repeat(unwoundCount));

    return createCodeBindings(code, bindings);

    // const {reader, minimumCount, maximumCount} = this;
    //
    // const bindings: Binding[] = [];
    // const indexVar = createVar();
    // const readerResultVar = createVar();
    // const readCountVar = createVar();
    //
    // return createCodeBindings(
    //     [
    //       'var ',
    //       indexVar, ',',
    //       readerResultVar, '=', offsetVar,
    //       minimumCount || maximumCount ? [',', readCountVar, '=0'] : '',
    //       ';',
    //       'do{',
    //
    //       // Ensure that we actually use a numeric result
    //       indexVar, '=', readerResultVar, '/1;',
    //       createReaderCallCode(reader, inputVar, indexVar, contextVar, readerResultVar, bindings),
    //       '}while(',
    //       readerResultVar, '>', indexVar,
    //       minimumCount || maximumCount ? ['&&++', readCountVar, maximumCount ? '<' + maximumCount : ''] : '',
    //       ')',
    //       resultVar, '=',
    //       minimumCount ? [readCountVar, '<', minimumCount, '?', NO_MATCH, ':'] : '',
    //       readerResultVar, '===', NO_MATCH, '?', indexVar, ':', readerResultVar,
    //       ';',
    //     ],
    //     bindings,
    // );
  }
}
