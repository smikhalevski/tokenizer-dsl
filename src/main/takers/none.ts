import {ResultCode, Taker} from '../taker-types';

/**
 * Taker that always returns `NO_MATCH`.
 */
export const none: Taker = () => ResultCode.NO_MATCH;
