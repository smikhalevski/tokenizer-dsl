import {Binding, Code, CodeBindings, Var} from 'codedegen';
import {createVar} from '../utils';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates a reader that applies readers one after another.
 *
 * @param readers Readers that are called.
 *
 * @template Context The context passed by tokenizer.
 */
export function seq<Context = any>(...readers: Reader<Context>[]): Reader<Context> {

  const children: Reader<Context>[] = [];

  for (const reader of readers) {
    if (reader instanceof SeqReader) {
      children.push(...reader.readers);
      continue;
    }
    if (reader !== none) {
      children.push(reader);
    }
  }
  if (children.includes(never)) {
    return never;
  }
  if (children.length === 0) {
    return none;
  }
  if (children.length === 1) {
    return children[0];
  }

  return new SeqReader(children);
}

export class SeqReader<Context> implements ReaderCodegen {

  constructor(public readers: Reader<Context>[]) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {readers} = this;

    const indexVar = createVar();
    const readerResultVar = createVar();

    const readersLength = readers.length;
    const bindings: Binding[] = [];
    const code: Code[] = [
      resultVar, '=-1;',

      'var ',
      indexVar, '=', offsetVar, ',',
      readerResultVar, ';',
    ];

    for (let i = 0; i < readersLength; ++i) {
      code.push(
          createReaderCallCode(readers[i], inputVar, indexVar, contextVar, readerResultVar, bindings),
          'if(', readerResultVar, '>=', indexVar, '){',
          i < readersLength - 1 ? indexVar : resultVar, '=', readerResultVar, ';',
      );
    }

    code.push('}'.repeat(readersLength));

    return createCodeBindings(code, bindings);
  }
}
