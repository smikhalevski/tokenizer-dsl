import {regex, RegexTaker} from '../../main/takers/regex';
import {ResultCode} from '../../main';

describe('regex', () => {

  test('returns RegexTaker', () => {
    expect(regex(/abc/)).toBeInstanceOf(RegexTaker);
  });
});

describe('RegexTaker', () => {

  test('takes text', () => {
    const taker = new RegexTaker(/abc/);

    expect(taker.take('aaaabc', 3)).toBe(6);
    expect(taker.take('aaaabcde', 3)).toBe(6);
    expect(taker.take('aaaab', 3)).toBe(ResultCode.NO_MATCH);
    expect(taker.take('aaaABC', 3)).toBe(ResultCode.NO_MATCH);
  });

  test('starts from the given offset', () => {
    const taker = new RegexTaker(/abc/);

    expect(taker.take('aaaabcabc', 6)).toBe(9);
  });

  test('ignores matches that do not start at offset', () => {
    const taker = new RegexTaker(/abc/);

    expect(taker.take('aaaabcabc', 5)).toBe(ResultCode.NO_MATCH);
  });
});
