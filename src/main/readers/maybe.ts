import {Binding, createVar, Var} from '../code';
import {never} from './never';
import {none} from './none';
import {CodeBindings, NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates reader that returns `reader` result or current offset if reader returned {@link NO_MATCH}.
 *
 * @param reader The reader which match must be considered optional.
 */
export function maybe<C = any>(reader: Reader<C>): Reader<C> {
  if (reader === none || reader === never) {
    return none;
  }
  return new MaybeReader(reader);
}

export class MaybeReader<C> implements ReaderCodegen {

  constructor(public reader: Reader<C>) {
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
