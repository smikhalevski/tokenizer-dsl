import {
  CaseInsensitiveTextReader,
  CaseSensitiveTextReader,
  NO_MATCH,
  none,
  text,
  toReaderFunction
} from '../../main/readers';

describe('text', () => {

  test('returns noneReader for an empty string', () => {
    expect(text('')).toBe(none);
  });

  test('returns CaseSensitiveTextReader', () => {
    expect(text('aaa')).toBeInstanceOf(CaseSensitiveTextReader);
    expect(text('123', {caseInsensitive: true})).toBeInstanceOf(CaseSensitiveTextReader);
  });

  test('returns CaseInsensitiveTextReader', () => {
    expect(text('aaa', {caseInsensitive: true})).toBeInstanceOf(CaseInsensitiveTextReader);
  });

  test('throws if text length is ambiguous', () => {
    expect(() => text('ßß', {caseInsensitive: true})).toThrow();
  });
});

describe('CaseSensitiveTextReader', () => {

  test('reads case-sensitive text', () => {
    const read = toReaderFunction(new CaseSensitiveTextReader('abc'));

    expect(read('aaaabc', 3)).toBe(6);
    expect(read('aaaabcde', 3)).toBe(6);
    expect(read('aaaab', 3)).toBe(NO_MATCH);
    expect(read('aaaABC', 3)).toBe(NO_MATCH);
  });
});

describe('CaseInsensitiveTextReader', () => {

  test('reads case-insensitive text', () => {
    const read = toReaderFunction(new CaseInsensitiveTextReader('abc'));

    expect(read('AAAABC', 3)).toBe(6);
    expect(read('AAAABCDE', 3)).toBe(6);
    expect(read('AAAAB', 3)).toBe(NO_MATCH);
  });
});
