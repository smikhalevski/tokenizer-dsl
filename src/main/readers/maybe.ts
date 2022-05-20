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
export function maybe<Context = any>(reader: Reader<Context>): Reader<Context> {
  if (reader === none || reader === never) {
    return none;
  }
  return new MaybeReader(reader);
}

export class MaybeReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    return createCodeBindings(
        [
          'var ', readerResultVar, ';',
          createReaderCallCode(this.reader, inputVar, offsetVar, contextVar, readerResultVar, bindings),
          resultVar, '=', readerResultVar, '<', offsetVar, '?', offsetVar, ':', readerResultVar, ';',
        ],
        bindings,
    );
  }
}
