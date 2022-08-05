import { Binding, Code, CodeBindings, compileFunction, Var } from 'codedegen';
import { createVar, isFunction } from '../utils';
import { Reader, ReaderFunction } from './reader-types';

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createReaderCallCode<Context>(reader: Reader<Context>, inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var, bindings: Binding[]): Code {

  if (isFunction(reader)) {
    const readerVar = createVar();
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
 * Converts the {@link Reader} instance to a function.
 *
 * @param reader The reader to convert to a function.
 *
 * @template Context The context passed by tokenizer.
 */
export function toReaderFunction<Context = void>(reader: Reader<Context>): ReaderFunction<Context> {

  if (isFunction(reader)) {
    return reader;
  }

  const bindings: Binding[] = [];
  const inputVar = createVar();
  const offsetVar = createVar();
  const contextVar = createVar();
  const resultVar = createVar();

  const code: Code = [
    'var ', resultVar, ';',
    createReaderCallCode(reader, inputVar, offsetVar, contextVar, resultVar, bindings),
    'return ', resultVar,
  ];

  return compileFunction([inputVar, offsetVar, contextVar], code, bindings);
}
