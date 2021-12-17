import {regex} from '../../main/takers/regex';
import {ResultCode, TakerType} from '../../main/taker-types';

describe('regex', () => {

  test('returns char for a single char string', () => {
    const taker = regex(/a/);

    expect(taker.type).toBe(TakerType.REGEX);
    expect(taker.data).toEqual(/a/y);
  });

  test('takes text', () => {
    const taker = regex(/abc/);

    expect(taker('aaaabc', 3)).toBe(6);
    expect(taker('aaaabcde', 3)).toBe(6);
    expect(taker('aaaab', 3)).toBe(ResultCode.NO_MATCH);
    expect(taker('aaaABC', 3)).toBe(ResultCode.NO_MATCH);
  });

  test('starts from the given offset', () => {
    const taker = regex(/abc/);

    expect(taker('aaaabcabc', 6)).toBe(9);
  });

  test('ignores matches that do not start at offset', () => {
    const taker = regex(/abc/);

    expect(taker('aaaabcabc', 5)).toBe(ResultCode.NO_MATCH);
  });
});
