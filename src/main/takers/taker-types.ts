import {Code, Var} from '../code';

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
 *
 * ```ts
 * const stringVar = createVar();
 *
 * const stringTakerCodegen: TakerCodegen = {
 *   factory(inputVar, offsetVar, resultVar) {
 *     return [resultVar, '=', inputVar, '.startsWith(', stringVar, ',', offsetVar, ')?', offsetVar, '+', stringVar, '.length:', NO_MATCH, ';'];
 *   },
 *   values: [[stringVar, 'abc']],
 * };
 * ```
 */
export interface TakerCodegen {
  factory: TakerCodeFactory;
  bindings?: [Var, unknown][] | undefined;
}

/**
 * The factory that returns the code body of the taker function. The produced code assigns the taker result for
 * `inputVar` and `offsetVar` to `resultVar`. The produced code must be a semicolon-terminated statement.
 *
 * ```ts
 * const abcTakerCodeFactory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
 *   return [resultVar, '=', inputVar, '.startsWith("abc",', offsetVar, ')?', offsetVar, '+3:', NO_MATCH, ';'];
 * };
 * ```
 */
export type TakerCodeFactory = (inputVar: Var, offsetVar: Var, resultVar: Var) => Code;

/**
 * OK return code that means that taker didn't match any chars.
 */
export const NO_MATCH = -1;

/**
 * The callback that must return `true` is given char code is appropriate, and must return `false` otherwise.
 */
export type CharCodeChecker = (charCode: number) => boolean;

export type CharCodeRangeLike = number | string | [number | string, number | string];

export type CharCodeRange = number | [number, number];
