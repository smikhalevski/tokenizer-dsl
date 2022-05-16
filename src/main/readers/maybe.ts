import {Binding, CodeBindings, createVar, Var} from 'codedegen';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates a reader that returns `reader` result or current offset if reader returned {@link NO_MATCH}.
 *
 * @param reader The reader which match must be considered optional.
 *
 * @template Context The context passed by tokenizer.
 */
export function maybe<Context = any, Error = never>(reader: Reader<Context, Error>): Reader<Context, Error> {
  if (reader === none || reader === never) {
    return none;
  }
  return new MaybeReader(reader);
}

export class MaybeReader<Context, Error> implements ReaderCodegen {

  constructor(public reader: Reader<Context, Error>) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const readerResultVar = createVar();

    return createCodeBindings(
        [
          'var ', readerResultVar, ';',
          createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),
          resultVar, '=', readerResultVar, '===', NO_MATCH, '?', offsetVar, ':', readerResultVar, ';',
        ],
        bindings,
    );
  }
}
