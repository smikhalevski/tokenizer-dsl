import {NO_MATCH, regex, RegexTaker, toTakerFunction} from '../../main/takers';

describe('regex', () => {

  test('returns RegexTaker', () => {
    expect(regex(/abc/)).toBeInstanceOf(RegexTaker);
  });
});

describe('RegexTaker', () => {

  test('takes text', () => {
    const take = toTakerFunction(new RegexTaker(/abc/));

    expect(take('aaaabc', 3)).toBe(6);
    expect(take('aaaabcde', 3)).toBe(6);
    expect(take('aaaab', 3)).toBe(NO_MATCH);
    expect(take('aaaABC', 3)).toBe(NO_MATCH);
  });

  test('starts from the given offset', () => {
    expect(toTakerFunction(new RegexTaker(/abc/))('aaaabcabc', 6)).toBe(9);
  });

  test('ignores matches that do not start at offset', () => {
    expect(toTakerFunction(new RegexTaker(/abc/))('aaaabcabc', 5)).toBe(NO_MATCH);
  });
});
