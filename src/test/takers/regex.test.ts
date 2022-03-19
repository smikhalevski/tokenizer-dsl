import {createRegexTaker, regex} from '../../main/takers/regex';
import {ResultCode} from '../../main';
import {TakerType} from '../../main/takers/TakerType';

describe('regex', () => {

  test('returns RegexTaker', () => {
    expect(regex(/abc/).__type).toBe(TakerType.RegexTaker);
  });
});

describe('createRegexTaker', () => {

  test('takes text', () => {
    const taker = createRegexTaker(/abc/);

    expect(taker('aaaabc', 3)).toBe(6);
    expect(taker('aaaabcde', 3)).toBe(6);
    expect(taker('aaaab', 3)).toBe(ResultCode.NO_MATCH);
    expect(taker('aaaABC', 3)).toBe(ResultCode.NO_MATCH);
  });

  test('starts from the given offset', () => {
    const taker = createRegexTaker(/abc/);

    expect(taker('aaaabcabc', 6)).toBe(9);
  });

  test('ignores matches that do not start at offset', () => {
    const taker = createRegexTaker(/abc/);

    expect(taker('aaaabcabc', 5)).toBe(ResultCode.NO_MATCH);
  });
});
