import {all, char, never, none, ResultCode, Taker, TakerType, text} from '../main';
import {
  createAllCaseSensitiveTextTaker,
  createAllCharTaker,
  createAllRegexTaker,
  createAllGenericTaker
} from '../main/all';

describe('all', () => {

  test('returns never', () => {
    expect(all(never)).toBe(never);
  });

  test('returns none', () => {
    expect(all(() => 0, {maximumCount: -1})).toBe(none);
    expect(all(() => 0, {maximumCount: 0})).toBe(none);
    expect(all(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect(all(() => 0, {maximumCount: 1}).__type).toBe(TakerType.MAYBE);
  });

  test('returns taker', () => {
    const takerMock: Taker = () => 0;
    expect(all(takerMock, {minimumCount: 1, maximumCount: 1})).toBe(takerMock);
  });

  test('returns AllCharTaker', () => {
    expect(all(char(() => false)).__type).toBe(TakerType.ALL_CHAR);
  });

  test('returns AllCaseSensitiveTextTaker', () => {
    expect(all(text('a')).__type).toBe(TakerType.ALL_CASE_SENSITIVE_TEXT);
    expect(all(text('aaa')).__type).toBe(TakerType.ALL_CASE_SENSITIVE_TEXT);
  });

  test('returns AllTaker', () => {
    expect(all(() => 0).__type).toBe(TakerType.ALL_GENERIC);
  });
});

describe('createAllCharTaker', () => {

  test('takes sequential chars', () => {
    expect(createAllCharTaker(() => true, 0, Infinity)('aaabbbccc', 2)).toBe(9);
    expect(createAllCharTaker(() => false, 1, Infinity)('aaabbbccc', 2)).toBe(ResultCode.NO_MATCH);
  });
});

describe('createAllCaseSensitiveTextTaker', () => {

  test('takes sequential case-insensitive substrings', () => {
    expect(createAllCaseSensitiveTextTaker('abc', 0, Infinity)('abcabcabcd', 3)).toBe(9);
    expect(createAllCaseSensitiveTextTaker('abc', 3, Infinity)('abcabcabcd', 3)).toBe(ResultCode.NO_MATCH);
  });
});

describe('createAllRegexTaker', () => {

  test('takes sequential regex matches', () => {
    expect(createAllRegexTaker(/a/, 0, Infinity)('aaaaabaaa', 3)).toBe(5);
    expect(createAllRegexTaker(/a/, 3, Infinity)('aaaaabaaa', 3)).toBe(ResultCode.NO_MATCH);
    expect(createAllRegexTaker(/a/, 0, 3)('aaaaa', 0)).toBe(3);
  });
});

describe('createAllTakerTaker', () => {

  test('takes until taker returns ResultCode.NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(createAllGenericTaker(takerMock, 0, Infinity)('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(3);
  });

  test('takes until taker returns the same offset', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(3);

    expect(createAllGenericTaker(takerMock, 0, Infinity)('aabbcc', 2)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(3);

    expect(createAllGenericTaker(takerMock, 0, Infinity)('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns ResultCode.NO_MATCH if minimum matches was not reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(createAllGenericTaker(takerMock, 2, Infinity)('a', 0)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(createAllGenericTaker(takerMock, 2, Infinity)('aaa', 0)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(4);
  });

  test('limits maximum read char count', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);

    expect(createAllGenericTaker(takerMock, 0, 2)('aaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('maximum does not affect the minimum', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(createAllGenericTaker(takerMock, 0, 2)('a', 0)).toBe(1);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});
