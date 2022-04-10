import {all, InternalTaker, never, NO_MATCH, none, text} from '../../main';
import {
  ALL_CASE_SENSITIVE_TEXT_TYPE, ALL_CHAR_CODE_RANGE_TYPE,
  ALL_GENERIC_TYPE,
  createAllCaseSensitiveTextTaker,
  createAllCharCodeRangeTaker,
  createAllGenericTaker,
  createAllRegexTaker, MAYBE_TYPE
} from '../../main/takers';

const A = 'a'.charCodeAt(0);

describe('all', () => {

  test('returns never', () => {
    expect(all(never)).toBe(never);
    expect(all(never, {minimumCount: 2, maximumCount: 1})).toBe(never);
    expect(all(never, {minimumCount: Infinity})).toBe(never);
  });

  test('returns none', () => {
    expect(all(none)).toBe(none);
  });

  test('returns unlimited taker', () => {
    expect((all(() => 0, {maximumCount: -1}) as InternalTaker).type).toBe(ALL_GENERIC_TYPE);
    expect((all(() => 0, {maximumCount: 0}) as InternalTaker).type).toBe(ALL_GENERIC_TYPE);
  });

  test('returns MaybeTaker', () => {
    expect((all(() => 0, {maximumCount: 1}) as InternalTaker).type).toBe(MAYBE_TYPE);
  });

  test('returns taker', () => {
    const baseTakerMock = () => 0;
    expect(all(baseTakerMock, {minimumCount: 1, maximumCount: 1})).toBe(baseTakerMock);
  });

  test('returns AllCaseSensitiveTextTaker', () => {
    expect((all(text('a')) as InternalTaker).type).toBe(ALL_CHAR_CODE_RANGE_TYPE);
    expect((all(text('aaa')) as InternalTaker).type).toBe(ALL_CASE_SENSITIVE_TEXT_TYPE);
  });

  test('returns AllTaker', () => {
    expect((all(() => 0) as InternalTaker).type).toBe(ALL_GENERIC_TYPE);
  });
});

describe('createAllCharCodeRangeTaker', () => {

  test('takes exact number of chars', () => {
    expect(createAllCharCodeRangeTaker([A], 2, 2)('aaaa', 0)).toBe(2);
    expect(createAllCharCodeRangeTaker([A], 2, 2)('aaaa', 1)).toBe(3);
    expect(createAllCharCodeRangeTaker([A], 2, 2)('aaaa', 2)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 2, 2)('abbb', 0)).toBe(NO_MATCH);
  });

  test('takes exact number of chars when length is insufficient', () => {
    expect(createAllCharCodeRangeTaker([A], 2, 2)('aaaa', 3)).toBe(NO_MATCH);
  });

  test('takes maximum number of chars', () => {
    expect(createAllCharCodeRangeTaker([A], 0, 2)('aaaa', 0)).toBe(2);
    expect(createAllCharCodeRangeTaker([A], 0, 2)('aaaa', 1)).toBe(3);
    expect(createAllCharCodeRangeTaker([A], 0, 2)('abbb', 0)).toBe(1);
  });

  test('takes maximum number of chars does not overflow input length', () => {
    expect(createAllCharCodeRangeTaker([A], 0, 2)('aaaa', 3)).toBe(4);
  });

  test('takes minimum and maximum number of chars', () => {
    expect(createAllCharCodeRangeTaker([A], 1, 2)('aaaa', 0)).toBe(2);
    expect(createAllCharCodeRangeTaker([A], 1, 2)('aaaa', 1)).toBe(3);
    expect(createAllCharCodeRangeTaker([A], 1, 2)('aaaa', 3)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 1, 2)('aaaa', 4)).toBe(NO_MATCH);
    expect(createAllCharCodeRangeTaker([A], 1, 2)('aabb', 1)).toBe(2);
    expect(createAllCharCodeRangeTaker([A], 1, 2)('aabb', 2)).toBe(NO_MATCH);
  });

  test('takes minimum number of chars', () => {
    expect(createAllCharCodeRangeTaker([A], 1, 0)('aaaa', 0)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 1, 0)('aaaa', 1)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 1, 0)('aaaa', 4)).toBe(NO_MATCH);
    expect(createAllCharCodeRangeTaker([A], 1, 0)('aabb', 1)).toBe(2);
    expect(createAllCharCodeRangeTaker([A], 1, 0)('aabb', 2)).toBe(NO_MATCH);
  });

  test('takes unlimited number of chars', () => {
    expect(createAllCharCodeRangeTaker([A], 0, 0)('aaaa', 0)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 0, 0)('aaaa', 1)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 0, 0)('aaaa', 4)).toBe(4);
    expect(createAllCharCodeRangeTaker([A], 0, 0)('aabb', 1)).toBe(2);
    expect(createAllCharCodeRangeTaker([A], 0, 0)('aabb', 2)).toBe(2);
  });
});

describe('createAllCaseSensitiveTextTaker', () => {

  test('takes sequential case-insensitive substrings', () => {
    expect(createAllCaseSensitiveTextTaker('abc', 0, 0)('abcabcabcd', 3)).toBe(9);
    expect(createAllCaseSensitiveTextTaker('abc', 3, 0)('abcabcabcd', 3)).toBe(NO_MATCH);
  });

  test('takes if count is sufficient', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 2, 0)('abababc', 2)).toBe(6);
  });

  test('does not take if count is insufficient', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 2, 0)('aabb', 1)).toBe(NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 0, 2)('abababab', 2)).toBe(6);
  });

  test('stops at string end', () => {
    expect(createAllCaseSensitiveTextTaker('ab', 0, 0)('abababab', 0)).toBe(8);
  });
});

describe('createAllRegexTaker', () => {

  test('takes sequential regex matches', () => {
    expect(createAllRegexTaker(/a/, 0, 0)('aaaaabaaa', 3)).toBe(5);
    expect(createAllRegexTaker(/a/, 3, 0)('aaaaabaaa', 3)).toBe(NO_MATCH);
    expect(createAllRegexTaker(/a/, 0, 3)('aaaaa', 0)).toBe(3);
  });

  test('takes if count is sufficient', () => {
    expect(createAllRegexTaker(/ab/, 2, 0)('abababc', 2)).toBe(6);
  });

  test('does not take if count is insufficient', () => {
    expect(createAllRegexTaker(/ab/, 2, 0)('aabb', 1)).toBe(NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(createAllRegexTaker(/ab/, 0, 2)('abababab', 2)).toBe(6);
  });

  test('stops at string end', () => {
    expect(createAllRegexTaker(/ab/, 0, 0)('abababab', 0)).toBe(8);
  });
});

describe('createAllGenericTaker', () => {

  test('takes until taker returns NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(createAllGenericTaker(takerMock, 0, 0)('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(3);
  });

  test('takes until taker returns the same offset', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(3);

    expect(createAllGenericTaker(takerMock, 0, 0)('aabbcc', 2)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(3);

    expect(createAllGenericTaker(takerMock, 0, 0)('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns NO_MATCH if minimum matches was not reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(createAllGenericTaker(takerMock, 2, 0)('a', 0)).toBe(NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(createAllGenericTaker(takerMock, 2, 0)('aaa', 0)).toBe(3);
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
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(createAllGenericTaker(takerMock, 0, 2)('a', 0)).toBe(1);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline takers', () => {
    expect(createAllGenericTaker(text('a'), 0, 0)('aabbcc', 0)).toBe(2);
  });
});
