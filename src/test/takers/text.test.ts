import {TakerCodegen, NO_MATCH, none, text} from '../../main';
import {createCaseInsensitiveTextTaker, createCaseSensitiveTextTaker} from '../../main/takers';

describe('text', () => {

  test('returns noneTaker for an empty string', () => {
    expect(text('')).toBe(none);
  });

  test('returns CaseSensitiveTextTaker', () => {
    expect((text('aaa') as TakerCodegen).type).toBe(CASE_SENSITIVE_TEXT_TYPE);
    expect((text('123', {caseInsensitive: true}) as TakerCodegen).type).toBe(CASE_SENSITIVE_TEXT_TYPE);
  });

  test('returns CaseInsensitiveTextTaker', () => {
    expect((text('aaa', {caseInsensitive: true}) as TakerCodegen).type).toBe(CASE_INSENSITIVE_TEXT_TYPE);
  });

  test('throws if text length is ambiguous', () => {
    expect(() => text('ßß', {caseInsensitive: true})).toThrow();
  });
});

describe('createCaseSensitiveTextTaker', () => {

  test('takes case-sensitive text', () => {
    const taker = createCaseSensitiveTextTaker('abc');

    expect(taker('aaaabc', 3)).toBe(6);
    expect(taker('aaaabcde', 3)).toBe(6);
    expect(taker('aaaab', 3)).toBe(NO_MATCH);
    expect(taker('aaaABC', 3)).toBe(NO_MATCH);
  });
});

describe('createCaseInsensitiveTextTaker', () => {

  test('takes case-insensitive text', () => {
    const taker = createCaseInsensitiveTextTaker('abc');

    expect(taker('AAAABC', 3)).toBe(6);
    expect(taker('AAAABCDE', 3)).toBe(6);
    expect(taker('AAAAB', 3)).toBe(NO_MATCH);
  });
});
