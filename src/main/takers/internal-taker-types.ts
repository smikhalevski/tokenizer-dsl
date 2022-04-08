import {TakerCodegen} from './taker-types';

/**
 * Taker function, that is a subject for internal optimizations.
 */
export interface InternalTaker extends TakerCodegen {
  type: symbol;
}

export const ALL_CHAR_CODE_CHECKER_TYPE = Symbol();
export const ALL_CHAR_CODE_RANGE_TYPE = Symbol();
export const ALL_CASE_SENSITIVE_TEXT_TYPE = Symbol();
export const ALL_REGEX_TYPE = Symbol();
export const ALL_GENERIC_TYPE = Symbol();
export const CHAR_CODE_CHECKER_TYPE = Symbol();
export const CHAR_CODE_RANGE_TYPE = Symbol();
export const END_TYPE = Symbol();
export const MAYBE_TYPE = Symbol();
export const OR_TYPE = Symbol();
export const REGEX_TYPE = Symbol();
export const SEQ_TYPE = Symbol();
export const SKIP_TYPE = Symbol();
export const CASE_SENSITIVE_TEXT_TYPE = Symbol();
export const CASE_INSENSITIVE_TEXT_TYPE = Symbol();
export const UNTIL_CASE_SENSITIVE_TEXT_TYPE = Symbol();
export const UNTIL_CHAR_CODE_RANGE_TYPE = Symbol();
export const UNTIL_CHAR_CODE_CHECKER_TYPE = Symbol();
export const UNTIL_REGEX_TYPE = Symbol();
export const UNTIL_GENERIC_TYPE = Symbol();
export const NONE_TYPE = Symbol();
export const NEVER_TYPE = Symbol();

export type ALL_CHAR_CODE_CHECKER_TYPE = typeof ALL_CHAR_CODE_CHECKER_TYPE;
export type ALL_CHAR_CODE_RANGE_TYPE = typeof ALL_CHAR_CODE_RANGE_TYPE;
export type ALL_CASE_SENSITIVE_TEXT_TYPE = typeof ALL_CASE_SENSITIVE_TEXT_TYPE;
export type ALL_REGEX_TYPE = typeof ALL_REGEX_TYPE;
export type ALL_GENERIC_TYPE = typeof ALL_GENERIC_TYPE;
export type CHAR_CODE_CHECKER_TYPE = typeof CHAR_CODE_CHECKER_TYPE;
export type CHAR_CODE_RANGE_TYPE = typeof CHAR_CODE_RANGE_TYPE;
export type END_TYPE = typeof END_TYPE;
export type MAYBE_TYPE = typeof MAYBE_TYPE;
export type OR_TYPE = typeof OR_TYPE;
export type REGEX_TYPE = typeof REGEX_TYPE;
export type SEQ_TYPE = typeof SEQ_TYPE;
export type SKIP_TYPE = typeof SKIP_TYPE;
export type CASE_SENSITIVE_TEXT_TYPE = typeof CASE_SENSITIVE_TEXT_TYPE;
export type CASE_INSENSITIVE_TEXT_TYPE = typeof CASE_INSENSITIVE_TEXT_TYPE;
export type UNTIL_CASE_SENSITIVE_TEXT_TYPE = typeof UNTIL_CASE_SENSITIVE_TEXT_TYPE;
export type UNTIL_CHAR_CODE_RANGE_TYPE = typeof UNTIL_CHAR_CODE_RANGE_TYPE;
export type UNTIL_CHAR_CODE_CHECKER_TYPE = typeof UNTIL_CHAR_CODE_CHECKER_TYPE;
export type UNTIL_REGEX_TYPE = typeof UNTIL_REGEX_TYPE;
export type UNTIL_GENERIC_TYPE = typeof UNTIL_GENERIC_TYPE;
export type NONE_TYPE = typeof NONE_TYPE;
export type NEVER_TYPE = typeof NEVER_TYPE;
