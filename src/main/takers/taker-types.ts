import {Code, Var} from '../code-types';

/**
 * The callback that must return `true` is given char code is appropriate, and must return `false` otherwise.
 */
export type CharCodeChecker = (charCode: number) => boolean;

export type CharCodeRangeLike = number | string | [number | string, number | string];

export type CharCodeRange = number | [number, number];

export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,
}

/**
 * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if taker
 * matched or a {@link ResultCode.NO_MATCH} if taker didn't match. The taker may return offsets that exceed the `input`
 * length.
 *
 * ```ts
 * const abcTaker: Taker = (input, offset) => {
 *   return input.startsWith('abc', offset) ? offset + 3 : ResultCode.NO_MATCH;
 * };
 * ```
 */
export type Taker = (input: string, offset: number) => number;

/**
 * The factory that returns the code body of the taker function. The produced code assigns the taker result for
 * `inputVar` and `offsetVar` to `resultVar`. The produced code must be a semicolon-terminated statement.
 *
 * ```ts
 * const abcTakerCodeFactory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
 *   return [resultVar, '=', inputVar, '.startsWith("abc",', offsetVar, ')?', offsetVar, '+3:', ResultCode.NO_MATCH, ';'];
 * };
 * ```
 */
export type TakerCodeFactory = (inputVar: Var, offsetVar: Var, resultVar: Var) => Code;

/**
 * Factory that returns the taker code and values for variables that must be bound to the taker.
 *
 * ```ts
 * const stringVar = createVar();
 *
 * const stringTakerCodegen: TakerCodegen = {
 *   factory(inputVar, offsetVar, resultVar) {
 *     return [resultVar, '=', inputVar, '.startsWith(', stringVar, ',', offsetVar, ')?', offsetVar, '+', stringVar, '.length:', ResultCode.NO_MATCH, ';'];
 *   },
 *   values: [[stringVar, 'abc']],
 * };
 * ```
 */
export interface TakerCodegen {
  factory: TakerCodeFactory;
  bindings?: [Var, unknown][] | undefined;
}

export type TakerLike = Taker | TakerCodegen;

/**
 * The type of the taker function, used for internal taker optimizations.
 *
 * @internal
 */
export const enum InternalTakerType {
  ALL_CHAR_CODE_CHECKER,
  ALL_CHAR_CODE_RANGE,
  ALL_CASE_SENSITIVE_TEXT,
  ALL_REGEX,
  ALL_GENERIC,
  CHAR_CODE_CHECKER,
  CHAR_CODE_RANGE,
  END,
  MAYBE,
  OR,
  REGEX,
  SEQ,
  SKIP,
  CASE_SENSITIVE_TEXT,
  CASE_INSENSITIVE_TEXT,
  UNTIL_CASE_SENSITIVE_TEXT,
  UNTIL_CHAR_CODE_RANGE,
  UNTIL_CHAR_CODE_CHECKER,
  UNTIL_REGEX,
  UNTIL_GENERIC,
  NONE,
  NEVER,
}

/**
 * Taker function, that is a subject for internal optimizations.
 *
 * @internal
 */
export interface InternalTaker extends Taker, TakerCodegen {
  type: InternalTakerType;
}
