import {Binding, Code, Var} from '../code';
import {never} from './never';
import {none} from './none';
import {CodeBindings, NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates a reader that returns the result of the first matched reader.
 *
 * @param readers Readers that are called.
 */
export function or<C = any>(...readers: Reader<C>[]): Reader<C> {

  const children: Reader<C>[] = [];

  for (const reader of readers) {
    if (reader === none) {
      break;
    }
    if (reader instanceof OrReader) {
      children.push(...reader.readers);
      continue;
    }
    if (reader !== never) {
      children.push(reader);
    }
  }
  if (children.length === 0) {
    return none;
  }
  if (children.length === 1) {
    return children[0];
  }

  return new OrReader(children);
}

export class OrReader<C> implements ReaderCodegen {

  constructor(public readers: Reader<C>[]) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {readers} = this;

    const readersLength = readers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < readersLength; ++i) {
      const reader = readers[i];

      code.push(createReaderCallCode(reader, inputVar, offsetVar, contextVar, resultVar, bindings));
      if (i < readersLength - 1) {
        code.push('if(', resultVar, '===', NO_MATCH, '){');
      }
    }
    code.push('}'.repeat(readersLength - 1));

    return createCodeBindings(code, bindings);
  }
}
