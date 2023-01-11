import { Binding, Var } from 'codedegen';
import { never } from './never';
import { none } from './none';
import { CodeBindings, Reader, ReaderCodegen } from './reader-types';
import { createCodeBindings, createReaderCallCode } from './reader-utils';

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
  constructor(public reader: Reader<Context>) {}

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const bindings: Binding[] = [];

    // prettier-ignore
    return createCodeBindings(
      [
        createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, resultVar, bindings),
        resultVar, '=', resultVar, '<', offsetVar, '?-1:', offsetVar, ';',
      ],
      bindings,
    );
  }
}
