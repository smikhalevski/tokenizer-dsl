import {Binding, Code, CodeBindings, Var} from 'codedegen';
import {createVar, die, toInteger} from '../utils';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
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
    minimumCount,
    maximumCount,
  } = options;

  minimumCount = toInteger(minimumCount);
  maximumCount = toInteger(maximumCount); // 0 = Infinity

  if (maximumCount !== 0 && minimumCount > maximumCount) {
    die('Maximum must be greater of equal than minimum');
  }
  if (minimumCount === 1 && maximumCount === 1 || reader === never || reader === none) {
    return reader;
  }
  return new AllReader(reader, minimumCount, maximumCount);
}

export class AllReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>, public minimumCount: number, public maximumCount: number) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {reader, minimumCount, maximumCount} = this;

    const indexVar = createVar();
    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    const code: Code[] = [
      resultVar, '=', minimumCount > 0 ? '-1' : offsetVar, ';',
      'var ',
      minimumCount > 1 ? [indexVar, '=', offsetVar, ','] : '',
      readerResultVar, minimumCount === 0 && maximumCount === 0 ? ['=', offsetVar] : '', ';',
    ];

    const count = Math.max(minimumCount, maximumCount);

    for (let i = 0; i < count; ++i) {
      const nextOffsetVar = i < minimumCount - 1 ? indexVar : resultVar;

      code.push(
          createReaderCallCode(reader, inputVar, i === 0 ? offsetVar : nextOffsetVar, contextVar, readerResultVar, bindings),
          'if(', readerResultVar, '>', i === 0 ? offsetVar : nextOffsetVar, '){',
          maximumCount === 0 && i === count - 1 ? '' : [nextOffsetVar, '=', readerResultVar, ';'],
      );
    }

    if (maximumCount === 0) {
      code.push(
          'do{',
          resultVar, '=', readerResultVar, ';',
          createReaderCallCode(reader, inputVar, resultVar, contextVar, readerResultVar, bindings),
          '}while(', readerResultVar, '>', resultVar, ')',
      );
    }

    code.push('}'.repeat(count));

    return createCodeBindings(code, bindings);
  }
}
