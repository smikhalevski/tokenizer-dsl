import {all, char, InternalTaker, InternalTakerType, never, none, ResultCode, text} from '../main';
import {
  createAllCaseSensitiveTextTaker,
  createAllCharCodeCheckerTaker,
  createAllCharCodeRangeTaker,
  createAllGenericTaker,
  createAllRegexTaker
} from '../main/all';

describe('all', () => {

  test('returns never', () => {
    expect(all(never)).toBe(never);
    expect(all(never, {minimumCount: 2, maximumCount: 1})).toBe(never);
    expect(all(never, {minimumCount: Infinity})).toBe(never);
  });

  test('returns none', () => {
    expect(all(() => 0, {maximumCount: -1})).toBe(none);
    expect(all(() => 0, {maximumCount: 0})).toBe(none);
    expect(all(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect((all(() => 0, {maximumCount: 1}) as InternalTaker).type).toBe(InternalTakerType.MAYBE);
  });

  test('returns taker', () => {
    const baseTakerMock = () => 0;
    expect(all(baseTakerMock, {minimumCount: 1, maximumCount: 1})).toBe(baseTakerMock);
  });

  test('returns AllCharCodeCheckerTaker', () => {
    expect((all(char(() => false)) as InternalTaker).type).toBe(InternalTakerType.ALL_CHAR_CODE_CHECKER);
  });

  test('returns AllCaseSensitiveTextTaker', () => {
    expect((all(text('a')) as InternalTaker).type).toBe(InternalTakerType.ALL_CHAR_CODE_RANGE);
    expect((all(text('aaa')) as InternalTaker).type).toBe(InternalTakerType.ALL_CASE_SENSITIVE_TEXT);
  });

  test('returns AllTaker', () => {
    expect((all(() => 0) as InternalTaker).type).toBe(InternalTakerType.ALL_GENERIC);
  });
});

describe('createAllCharCodeCheckerTaker', () => {

  test('takes sequential chars', () => {
    expect(createAllCharCodeCheckerTaker(() => true, 0, Infinity)('aaabbbccc', 2)).toBe(9);
    expect(createAllCharCodeCheckerTaker(() => false, 1, Infinity)('aaabbbccc', 2)).toBe(ResultCode.NO_MATCH);
  });

  test('takes if count is sufficient', () => {
    const charCodeCheckerMock = jest.fn(() => false);
    charCodeCheckerMock.mockReturnValueOnce(true);
    charCodeCheckerMock.mockReturnValueOnce(true);
    charCodeCheckerMock.mockReturnValueOnce(false);

    expect(createAllCharCodeCheckerTaker(charCodeCheckerMock, 2, Infinity)('aaaa', 1)).toBe(3);
  });

  test('does not take if count is insufficient', () => {
    const charCodeCheckerMock = jest.fn(() => false);
    charCodeCheckerMock.mockReturnValueOnce(true);
    charCodeCheckerMock.mockReturnValueOnce(false);

    expect(createAllCharCodeCheckerTaker(charCodeCheckerMock, 2, Infinity)('aaaa', 1)).toBe(ResultCode.NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(createAllCharCodeCheckerTaker(() => true, 0, 2)('aaaa', 1)).toBe(3);
  });

  test('stops at string end', () => {
    expect(createAllCharCodeCheckerTaker(() => true, 0, Infinity)('aaaa', 1)).toBe(4);
  });
});

describe('createAllCharCodeRangeTaker', () => {

  test('takes sequential chars', () => {
    expect(createAllCharCodeRangeTaker(['a'.charCodeAt(0), 'b'.charCodeAt(0)], 0, Infinity)('aaabbbccc', 2)).toBe(6);
    expect(createAllCharCodeRangeTaker([['a'.charCodeAt(0), 'c'.charCodeAt(0)]], 0, Infinity)('aaabbbccc', 2)).toBe(9);
  });

  test('takes if count is sufficient', () => {
    expect(createAllCharCodeRangeTaker(['a'.charCodeAt(0)], 2, Infinity)('aaab', 1)).toBe(3);
  });

  test('does not take if count is insufficient', () => {
    expect(createAllCharCodeRangeTaker(['a'.charCodeAt(0)], 2, Infinity)('aabb', 1)).toBe(ResultCode.NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(createAllCharCodeRangeTaker(['a'.charCodeAt(0)], 0, 2)('aaaa', 1)).toBe(3);
  });

  test('stops at string end', () => {
    expect(createAllCharCodeRangeTaker(['a'.charCodeAt(0)], 0, Infinity)('aaaa', 1)).toBe(4);
  });
});

describe('createAllCaseSensitiveTextTaker', () => {

  test('takes sequential case-insensitive substrings', () => {
    expect(createAllCaseSensitiveTextTaker('abc', 0, Infinity)('abcabcabcd', 3)).toBe(9);
    expect(createAllCaseSensitiveTextTaker('abc', 3, Infinity)('abcabcabcd', 3)).toBe(ResultCode.NO_MATCH);
  });

  test('takes if count is sufficient', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 2, Infinity)('abababc', 2)).toBe(6);
  });

  test('does not take if count is insufficient', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 2, Infinity)('aabb', 1)).toBe(ResultCode.NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 0, 2)('abababab', 2)).toBe(6);
  });

  test('stops at string end', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 0, Infinity)('abababab', 0)).toBe(8);
  });
});

describe('createAllRegexTaker', () => {

  test('takes sequential regex matches', () => {
    expect(createAllRegexTaker(/a/, 0, Infinity)('aaaaabaaa', 3)).toBe(5);
    expect(createAllRegexTaker(/a/, 3, Infinity)('aaaaabaaa', 3)).toBe(ResultCode.NO_MATCH);
    expect(createAllRegexTaker(/a/, 0, 3)('aaaaa', 0)).toBe(3);
  });

  test('takes if count is sufficient', () => {
    expect(createAllRegexTaker(/ab/, 2, Infinity)('abababc', 2)).toBe(6);
  });

  test('does not take if count is insufficient', () => {
    expect(createAllRegexTaker(/ab/, 2, Infinity)('aabb', 1)).toBe(ResultCode.NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(createAllRegexTaker(/ab/, 0, 2)('abababab', 2)).toBe(6);
  });

  test('stops at string end', () => {
    expect(createAllRegexTaker(/ab/, 0, Infinity)('abababab', 0)).toBe(8);
  });
});

describe('createAllGenericTaker', () => {

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

  test('can use inline takers', () => {
    expect(createAllGenericTaker(text('a'), 0, Infinity)('aabbcc', 0)).toBe(2);
  });
});
