import { Binding, Code, Var } from 'codedegen';
import { ExternalValue } from '../externalValue';

/**
 * The reader definition that can be compiled into a function that reads chars from the input string.
 *
 * @template Context The context passed by tokenizer.
 */
export type Reader<Context = void> = ReaderFunction<Context> | ReaderCodegen | ExternalValue;

/**
 * Takes the string `input` and the offset in this string `offset` and returns the next offset that is greater or equal
 * to `offset` if reader matched or returns an offset that is less than `offset` if reader didn't match. The reader may
 * return offsets that exceed the `input` length.
 *
 * ```ts
 * const abcReader: Reader = (input, offset) => {
 *   return input.startsWith('abc', offset) ? offset + 3 : -1;
 * };
 * ```
 *
 * @template Context The context passed by tokenizer.
 */
export type ReaderFunction<Context = void> = (input: string, offset: number, context: Context) => number;

/**
 * Factory that returns the reader code and values for variables that must be bound to the reader.
 */
export interface ReaderCodegen {
  /**
   * The factory that returns the code of the reader function. The produced code assigns the reader result for
   * `inputVar` and `offsetVar` to `resultVar`. The produced code must be a semicolon-terminated statement.
   *
   * ```ts
   * const abcReaderCodegenFactory: ReaderCodegenFactory = (inputVar, offsetVar, contextVar, resultVar) => {
   *   const abcVar = Symbol();
   *   return {
   *     code: [resultVar, '=', inputVar, '.startsWith(', abcVar, ',', offsetVar, ')?', offsetVar, '+3:-1;'],
   *     bindings: [[abcVar, 'abc']],
   *   };
   * };
   * ```
   *
   * @param inputVar The variable that holds the input string.
   * @param offsetVar The variable that holds the offset in the input string from which the reader must be applied.
   * @param contextVar The variable that holds the reader context.
   * @param resultVar The variable to which the reader result must be assigned.
   * @returns The source code and required variable bindings.
   */
  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings;
}

/**
 * The code to compile and associated optional variable value bindings.
 */
export interface CodeBindings {
  /**
   * The code to compile.
   */
  code: Code;

  /**
   * The variable value bindings.
   */
  bindings?: Binding[];
}
