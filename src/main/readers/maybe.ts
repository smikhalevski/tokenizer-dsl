import {Binding, CodeBindings, Var} from 'codedegen';
import {createVar} from '../utils';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates a reader that returns `reader` result or current offset if reader returned didn't match.
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

    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    return createCodeBindings(
        [
          'var ', readerResultVar, ';',
          createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),
          resultVar, '=typeof ', readerResultVar, '==="number"&&', readerResultVar, '<', offsetVar, '?', offsetVar, ':', readerResultVar, ';',
        ],
        bindings,
    );
  }
}
