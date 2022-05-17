import {Binding, Code, CodeBindings, compileFunction, createVar, Var} from 'codedegen';
import {Reader, ReaderFunction} from './reader-types';

/**
 * OK code returned from a reader that means that it didn't match any chars.
 */
export const NO_MATCH = -1;

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createReaderCallCode<Context, Error>(reader: Reader<Context, Error>, inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var, bindings: Binding[]): Code {

  if (typeof reader === 'function') {
    const readerVar = createVar();
    bindings.push([readerVar, reader]);

    return [resultVar, '=', readerVar, '(', inputVar, ',', offsetVar, ',', contextVar, ')', ';'];
  }

  const codeBindings = reader.factory(inputVar, offsetVar, contextVar, resultVar);

  if (codeBindings.bindings) {
    bindings.push(...codeBindings.bindings);
  }
  return codeBindings.code;
}

export function createCodeBindings(code: Code, bindings?: Binding[]): CodeBindings {
  return {code, bindings};
}

/**
 * Converts the {@link Reader} instance to a function.
 *
 * @param reader The reader to convert to a function.
 *
 * @template Context The context passed by tokenizer.
 */
export function toReaderFunction<Context = void, Error = never>(reader: Reader<Context, Error>): ReaderFunction<Context, Error> {

  if (typeof reader === 'function') {
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
