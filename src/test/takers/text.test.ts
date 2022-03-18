import {
  CaseInsensitiveCharTaker,
  CaseInsensitiveTextTaker,
  CaseSensitiveCharTaker,
  CaseSensitiveTextTaker,
  none,
  ResultCode,
  text
} from '../../main';

describe('text', () => {

  test('returns noneTaker for an empty string', () => {
    expect(text('')).toBe(none);
  });

  test('returns CaseSensitiveCharTaker', () => {
    expect(text('a')).toBeInstanceOf(CaseSensitiveCharTaker);
    expect(text('1', {caseInsensitive: true})).toBeInstanceOf(CaseSensitiveCharTaker);
  });

  test('returns CaseInsensitiveCharTaker', () => {
    expect(text('a', {caseInsensitive: true})).toBeInstanceOf(CaseInsensitiveCharTaker);
  });

  test('returns CaseSensitiveTextTaker', () => {
    expect(text('aaa')).toBeInstanceOf(CaseSensitiveTextTaker);
    expect(text('123', {caseInsensitive: true})).toBeInstanceOf(CaseSensitiveTextTaker);
  });

  test('returns CaseInsensitiveTextTaker', () => {
    expect(text('aaa', {caseInsensitive: true})).toBeInstanceOf(CaseInsensitiveTextTaker);
  });
});

describe('CaseSensitiveCharTaker', () => {

  test('takes case sensitive char', () => {
    expect(new CaseSensitiveCharTaker('a').take('bac', 1)).toBe(2);
    expect(new CaseSensitiveCharTaker('A').take('bac', 1)).toBe(ResultCode.NO_MATCH);
  });
});

describe('CaseInsensitiveCharTaker', () => {

  test('takes case-insensitive char', () => {
    expect(new CaseInsensitiveCharTaker('a', undefined).take('bac', 1)).toBe(2);
    expect(new CaseInsensitiveCharTaker('A', undefined).take('bac', 1)).toBe(2);
    expect(new CaseInsensitiveCharTaker('b', undefined).take('bac', 1)).toBe(ResultCode.NO_MATCH);
  });
});

describe('CaseSensitiveTextTaker', () => {

  test('takes case-sensitive text', () => {
    const taker = new CaseSensitiveTextTaker('abc');

    expect(taker.take('aaaabc', 3)).toBe(6);
    expect(taker.take('aaaabcde', 3)).toBe(6);
    expect(taker.take('aaaab', 3)).toBe(ResultCode.NO_MATCH);
    expect(taker.take('aaaABC', 3)).toBe(ResultCode.NO_MATCH);
  });
});

describe('CaseInsensitiveTextTaker', () => {

  test('takes case-insensitive text', () => {
    const taker = new CaseInsensitiveTextTaker('abc', undefined);

    expect(taker.take('AAAABC', 3)).toBe(6);
    expect(taker.take('AAAABCDE', 3)).toBe(6);
    expect(taker.take('AAAAB', 3)).toBe(ResultCode.NO_MATCH);
  });
});
