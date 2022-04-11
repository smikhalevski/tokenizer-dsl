import {
  CaseInsensitiveTextTaker,
  CaseSensitiveTextTaker,
  NO_MATCH,
  none,
  text,
  toTakerFunction
} from '../../main/takers';

describe('text', () => {

  test('returns noneTaker for an empty string', () => {
    expect(text('')).toBe(none);
  });

  test('returns CaseSensitiveTextTaker', () => {
    expect(text('aaa')).toBeInstanceOf(CaseSensitiveTextTaker);
    expect(text('123', {caseInsensitive: true})).toBeInstanceOf(CaseSensitiveTextTaker);
  });

  test('returns CaseInsensitiveTextTaker', () => {
    expect(text('aaa', {caseInsensitive: true})).toBeInstanceOf(CaseInsensitiveTextTaker);
  });

  test('throws if text length is ambiguous', () => {
    expect(() => text('ßß', {caseInsensitive: true})).toThrow();
  });
});

describe('CaseSensitiveTextTaker', () => {

  test('takes case-sensitive text', () => {
    const take = toTakerFunction(new CaseSensitiveTextTaker('abc'));

    expect(take('aaaabc', 3)).toBe(6);
    expect(take('aaaabcde', 3)).toBe(6);
    expect(take('aaaab', 3)).toBe(NO_MATCH);
    expect(take('aaaABC', 3)).toBe(NO_MATCH);
  });
});

describe('CaseInsensitiveTextTaker', () => {

  test('takes case-insensitive text', () => {
    const take = toTakerFunction(new CaseInsensitiveTextTaker('abc'));

    expect(take('AAAABC', 3)).toBe(6);
    expect(take('AAAABCDE', 3)).toBe(6);
    expect(take('AAAAB', 3)).toBe(NO_MATCH);
  });
});
