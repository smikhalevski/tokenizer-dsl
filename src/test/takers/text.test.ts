import {none, ResultCode, text} from '../../main';
import {
  createCaseInsensitiveCharTaker,
  createCaseInsensitiveTextTaker,
  createCaseSensitiveCharTaker,
  createCaseSensitiveTextTaker
} from '../../main/takers/text';
import {TakerType} from '../../main/takers/TakerType';

describe('text', () => {

  test('returns noneTaker for an empty string', () => {
    expect(text('')).toBe(none);
  });

  test('returns CaseSensitiveCharTaker', () => {
    expect(text('a').__type).toBe(TakerType.CaseSensitiveCharTaker);
    expect(text('1', {caseInsensitive: true}).__type).toBe(TakerType.CaseSensitiveCharTaker);
  });

  test('returns CaseInsensitiveCharTaker', () => {
    expect(text('a', {caseInsensitive: true}).__type).toBe(TakerType.CaseInsensitiveCharTaker);
  });

  test('returns CaseSensitiveTextTaker', () => {
    expect(text('aaa').__type).toBe(TakerType.CaseSensitiveTextTaker);
    expect(text('123', {caseInsensitive: true}).__type).toBe(TakerType.CaseSensitiveTextTaker);
  });

  test('returns CaseInsensitiveTextTaker', () => {
    expect(text('aaa', {caseInsensitive: true}).__type).toBe(TakerType.CaseInsensitiveTextTaker);
  });
});

describe('createCaseSensitiveCharTaker', () => {

  test('takes case sensitive char', () => {
    expect(createCaseSensitiveCharTaker('a')('bac', 1)).toBe(2);
    expect(createCaseSensitiveCharTaker('A')('bac', 1)).toBe(ResultCode.NO_MATCH);
  });
});

describe('createCaseInsensitiveCharTaker', () => {

  test('takes case-insensitive char', () => {
    expect(createCaseInsensitiveCharTaker('a', undefined)('bac', 1)).toBe(2);
    expect(createCaseInsensitiveCharTaker('A', undefined)('bac', 1)).toBe(2);
    expect(createCaseInsensitiveCharTaker('b', undefined)('bac', 1)).toBe(ResultCode.NO_MATCH);
  });
});

describe('createCaseSensitiveTextTaker', () => {

  test('takes case-sensitive text', () => {
    const taker = createCaseSensitiveTextTaker('abc');

    expect(taker('aaaabc', 3)).toBe(6);
    expect(taker('aaaabcde', 3)).toBe(6);
    expect(taker('aaaab', 3)).toBe(ResultCode.NO_MATCH);
    expect(taker('aaaABC', 3)).toBe(ResultCode.NO_MATCH);
  });
});

describe('createCaseInsensitiveTextTaker', () => {

  test('takes case-insensitive text', () => {
    const taker = createCaseInsensitiveTextTaker('abc', undefined);

    expect(taker('AAAABC', 3)).toBe(6);
    expect(taker('AAAABCDE', 3)).toBe(6);
    expect(taker('AAAAB', 3)).toBe(ResultCode.NO_MATCH);
  });
});
