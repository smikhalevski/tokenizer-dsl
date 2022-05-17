import {Binding, Code, CodeBindings, Var} from 'codedegen';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';

/**
 * Creates a reader that returns the result of the first matched reader.
 *
 * @param readers Readers that are called.
 *
 * @template Context The context passed by tokenizer.
 */
export function or<Context = any, Error = never>(...readers: Reader<Context, Error>[]): Reader<Context, Error> {

  const children: Reader<Context, Error>[] = [];

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

export class OrReader<Context, Error> implements ReaderCodegen {

  constructor(public readers: Reader<Context, Error>[]) {
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
        code.push('if(typeof ', resultVar, '==="number"&&', resultVar, '<', offsetVar, '){');
      }
    }
    code.push('}'.repeat(readersLength - 1));

    return createCodeBindings(code, bindings);
  }
}
