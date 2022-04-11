import {Binding, Code, Var} from '../code';

export type Taker = TakerFunction | TakerCodegen;

/**
 * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if taker
 * matched or a {@link NO_MATCH} if taker didn't match. The taker may return offsets that exceed the `input`
 * length.
 *
 * ```ts
 * const abcTaker: Taker = (input, offset) => {
 *   return input.startsWith('abc', offset) ? offset + 3 : NO_MATCH;
 * };
 * ```
 */
export type TakerFunction = (input: string, offset: number) => number;

/**
 * Factory that returns the taker code and values for variables that must be bound to the taker.
 */
export interface TakerCodegen {

  /**
   * The factory that returns the code body of the taker function. The produced code assigns the taker result for
   * `inputVar` and `offsetVar` to `resultVar`. The produced code must be a semicolon-terminated statement.
   *
   * ```ts
   * const abcTakerCodegenFactory: TakerCodegenFactory = (inputVar, offsetVar, resultVar) => {
   *   const abcVar = Symbol();
   *   return {
   *     code: [resultVar, '=', inputVar, '.startsWith(', abcVar, ',', offsetVar, ')?', offsetVar, '+3:', NO_MATCH, ';'],
   *     bindings: [[abcVar, 'abc']],
   *   };
   * };
   * ```
   */
  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings;
}

export interface CodeBindings {
  code: Code;
  bindings?: Binding[];
}

/**
 * OK return code that means that taker didn't match any chars.
 */
export const NO_MATCH = -1;
