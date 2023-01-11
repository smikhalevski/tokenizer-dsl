import { Binding, Code, compileFunction, createVar, Var } from 'codedegen';
import { die, isCallable, isExternalValue, isFunction } from '../utils';
import { CodeBindings, Reader, ReaderFunction } from './reader-types';

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createReaderCallCode<Context>(
  reader: Reader<Context>,
  inputVar: Var,
  offsetVar: Var,
  contextVar: Var,
  resultVar: Var,
  bindings: Binding[]
): Code {
  if (isCallable(reader)) {
    const readerVar = createVar('reader');
    bindings.push([readerVar, reader]);

    return [resultVar, '=', readerVar, '(', inputVar, ',', offsetVar, ',', contextVar, ');'];
  }

  const codeBindings = reader.factory(inputVar, offsetVar, contextVar, resultVar);

  if (codeBindings.bindings) {
    bindings.push(...codeBindings.bindings);
  }
  return codeBindings.code;
}

export function createCodeBindings(code: Code, bindings?: Binding[]): CodeBindings {
  return { code, bindings };
}

/**
 * Converts the {@linkcode Reader} instance to a function.
 *
 * @param reader The reader to convert to a function.
 * @template Context The context passed by tokenizer.
 */
export function toReaderFunction<Context = void>(reader: Reader<Context>): ReaderFunction<Context> {
  if (isExternalValue(reader)) {
    die('Cannot use external value at runtime');
  }

  if (isFunction(reader)) {
    return reader;
  }

  const bindings: Binding[] = [];
  const inputVar = createVar('input');
  const offsetVar = createVar('offset');
  const contextVar = createVar('context');
  const resultVar = createVar('result');

  // prettier-ignore
  const code: Code = [
    'var ', resultVar, ';',
    createReaderCallCode(reader, inputVar, offsetVar, contextVar, resultVar, bindings),
    'return ', resultVar,
  ];

  return compileFunction([inputVar, offsetVar, contextVar], code, bindings);
}
