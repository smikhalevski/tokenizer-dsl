import {Binding, CodeBindings, createVar, Var} from '../code';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates a reader that returns the current offset if the reader matches.
 */
export function lookahead<Context>(reader: Reader<Context>): Reader<Context> {
  if (reader === none || reader === never) {
    return reader;
  }
  return new LookaheadReader(reader);
}

export class LookaheadReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const readerResultVar = createVar();

    return createCodeBindings(
        [
          'var ', readerResultVar, ';',
          createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),
          resultVar, '=', readerResultVar, '<0?', readerResultVar, ':', offsetVar, ';',
        ],
        bindings,
    );
  }
}
