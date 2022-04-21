import {Binding, Code, Var} from '../code';

export type Reader<Context> = ReaderFunction<Context> | ReaderCodegen;

/**
 * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if reader
 * matched or a {@link NO_MATCH} if reader didn't match. The reader may return offsets that exceed the `input`
 * length.
 *
 * ```ts
 * const abcReader: Reader = (input, offset) => {
 *   return input.startsWith('abc', offset) ? offset + 3 : NO_MATCH;
 * };
 * ```
 */
export type ReaderFunction<Context> = (input: string, offset: number, context: Context) => number;

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
   *     code: [resultVar, '=', inputVar, '.startsWith(', abcVar, ',', offsetVar, ')?', offsetVar, '+3:', NO_MATCH, ';'],
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

export interface CodeBindings {
  code: Code;
  bindings?: Binding[];
}

/**
 * OK code returned from the {@link Reader} that means that it didn't match any chars.
 */
export const NO_MATCH = -1;
