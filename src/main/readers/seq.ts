import {Binding, Code, CodeBindings, createVar, Var} from 'codedegen';
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

    const readersLength = readers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < readersLength - 1; ++i) {
      const reader = readers[i];
      const readerResultVar = createVar();

      code.push(
          'var ', readerResultVar, ';',
          createReaderCallCode(reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),

          // Break seq if NO_MATCH or an error (NaN or < 0)
          'if(!(', readerResultVar, '>=0)){',
          resultVar, '=', readerResultVar,
          '}else{',

          // Ensure that a numeric value is used
          readerResultVar, '/=1;',
      );

      offsetVar = readerResultVar;
    }

    code.push(
        createReaderCallCode(readers[readersLength - 1], inputVar, offsetVar, contextVar, resultVar, bindings),
        '}'.repeat(readersLength - 1),
    );
    return createCodeBindings(code, bindings);
  }
}
