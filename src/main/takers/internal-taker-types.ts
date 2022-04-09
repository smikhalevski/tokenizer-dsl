import {TakerCodegen} from './taker-types';

/**
 * Taker that is a subject for internal optimizations.
 */
export interface InternalTaker extends TakerCodegen {
  type: symbol;
}

const createType = Symbol;

export const ALL_CHAR_CODE_RANGE_TYPE = createType();
export const ALL_CASE_SENSITIVE_TEXT_TYPE = createType();
export const ALL_REGEX_TYPE = createType();
export const ALL_GENERIC_TYPE = createType();
export const CHAR_CODE_RANGE_TYPE = createType();
export const END_TYPE = createType();
export const MAYBE_TYPE = createType();
export const OR_TYPE = createType();
export const REGEX_TYPE = createType();
export const SEQ_TYPE = createType();
export const SKIP_TYPE = createType();
export const CASE_SENSITIVE_TEXT_TYPE = createType();
export const CASE_INSENSITIVE_TEXT_TYPE = createType();
export const UNTIL_CASE_SENSITIVE_TEXT_TYPE = createType();
export const UNTIL_CHAR_CODE_RANGE_TYPE = createType();
export const UNTIL_REGEX_TYPE = createType();
export const UNTIL_GENERIC_TYPE = createType();

export type ALL_CHAR_CODE_RANGE_TYPE = typeof ALL_CHAR_CODE_RANGE_TYPE;
export type ALL_CASE_SENSITIVE_TEXT_TYPE = typeof ALL_CASE_SENSITIVE_TEXT_TYPE;
export type ALL_REGEX_TYPE = typeof ALL_REGEX_TYPE;
export type ALL_GENERIC_TYPE = typeof ALL_GENERIC_TYPE;
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
export type UNTIL_REGEX_TYPE = typeof UNTIL_REGEX_TYPE;
export type UNTIL_GENERIC_TYPE = typeof UNTIL_GENERIC_TYPE;
