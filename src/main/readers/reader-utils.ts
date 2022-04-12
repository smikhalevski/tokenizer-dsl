import {Binding, Code, compileFunction, createVar, Var} from '../code';
import {CodeBindings, Reader, ReaderFunction} from './reader-types';

export function toCharCodes(str: string): number[] {
  const charCodes: number[] = [];

  for (let i = 0; i < str.length; ++i) {
    charCodes.push(str.charCodeAt(i));
  }
  return charCodes;
}

export function createReaderCallCode<C>(reader: Reader<C>, inputVar: Var, offsetVar: Var, contextVar: Var, returnVar: Var, bindings: Binding[]): Code {

  if ('factory' in reader) {
    const codeBindings = reader.factory(inputVar, offsetVar, contextVar, returnVar);

    if (codeBindings.bindings) {
      bindings.push(...codeBindings.bindings);
    }
    return codeBindings.code;
  }

  const readerVar = createVar();
  bindings.push([readerVar, reader]);

  return [returnVar, '=', readerVar, '(', inputVar, ',', offsetVar, ',', contextVar, ')', ';'];
}

export function createCodeBindings(code: Code, bindings?: Binding[]): CodeBindings {
  return {code, bindings};
}

export function toReaderFunction<C = void>(reader: Reader<C>): ReaderFunction<C> {
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
