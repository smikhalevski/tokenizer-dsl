import {Binding, CodeBindings, Var} from 'codedegen';
import {createVar} from '../utils';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode, NO_MATCH} from './reader-utils';

/**
 * Creates a reader that returns the current offset if the reader matches.
 */
export function lookahead<Context = any, Error = never>(reader: Reader<Context, Error>): Reader<Context, Error> {
  if (reader === none || reader === never) {
    return reader;
  }
  return new LookaheadReader(reader);
}

export class LookaheadReader<Context, Error> implements ReaderCodegen {

  constructor(public reader: Reader<Context, Error>) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    return createCodeBindings(
        [
          'var ', readerResultVar, ';',
          createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),
          resultVar, '=typeof ', readerResultVar, '!=="number"||', readerResultVar, '<', offsetVar, '?', NO_MATCH, ':', offsetVar, ';',
        ],
        bindings,
    );
  }
}
