import {Binding, CodeBindings, Var} from 'codedegen';
import {createVar} from '../utils';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode, NO_MATCH} from './reader-utils';

/**
 * Creates a reader that returns the current offset if the reader matches.
 */
export function lookahead<Context = any>(reader: Reader<Context>): Reader<Context> {
  if (reader === none || reader === never) {
    return reader;
  }
  return new LookaheadReader(reader);
}

export class LookaheadReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    return createCodeBindings(
        [
          'var ', readerResultVar, ';',
          createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),
          resultVar, '=', readerResultVar, '<', offsetVar, '?', NO_MATCH, ':', offsetVar, ';',
        ],
        bindings,
    );
  }
}
