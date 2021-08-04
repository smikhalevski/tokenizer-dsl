import {ResultCode} from './ResultCode';

/**
 * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if taker
 * matched or a result code if taker didn't match. The taker may return offsets that exceed the `input` length.
 */
export interface Taker {

  (input: string, offset: number): ResultCode | number;

  __factory?: [Function, ...Array<any>];
}

export type CharCodeChecker = (charCode: number) => boolean;
