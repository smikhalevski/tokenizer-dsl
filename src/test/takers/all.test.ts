import {
  all,
  AllCaseSensitiveTextTaker,
  AllCharCodeRangeTaker,
  AllRegexTaker,
  AllTaker,
  MaybeTaker,
  never,
  NO_MATCH,
  none,
  text,
  toTakerFunction
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
    expect(all(() => 0, {maximumCount: -1})).toBeInstanceOf(AllTaker);
    expect(all(() => 0, {maximumCount: 0})).toBeInstanceOf(AllTaker);
  });

  test('returns MaybeTaker', () => {
    expect(all(() => 0, {maximumCount: 1})).toBeInstanceOf(MaybeTaker);
  });

  test('returns taker', () => {
    const baseTakerMock = () => 0;
    expect(all(baseTakerMock, {minimumCount: 1, maximumCount: 1})).toBe(baseTakerMock);
  });

  test('returns AllCaseSensitiveTextTaker', () => {
    expect(all(text('a'))).toBeInstanceOf(AllCharCodeRangeTaker);
    expect(all(text('aaa'))).toBeInstanceOf(AllCaseSensitiveTextTaker);
  });

  test('returns AllTaker', () => {
    expect(all(() => 0)).toBeInstanceOf(AllTaker);
  });
});

describe('AllCharCodeRangeTaker', () => {

  test('takes exact number of chars', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 2, 2))('aaaa', 0)).toBe(2);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 2, 2))('aaaa', 1)).toBe(3);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 2, 2))('aaaa', 2)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 2, 2))('abbb', 0)).toBe(NO_MATCH);
  });

  test('takes exact number of chars when length is insufficient', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 2, 2))('aaaa', 3)).toBe(NO_MATCH);
  });

  test('takes maximum number of chars', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 2))('aaaa', 0)).toBe(2);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 2))('aaaa', 1)).toBe(3);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 2))('abbb', 0)).toBe(1);
  });

  test('takes maximum number of chars does not overflow input length', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 2))('aaaa', 3)).toBe(4);
  });

  test('takes minimum and maximum number of chars', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 2))('aaaa', 0)).toBe(2);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 2))('aaaa', 1)).toBe(3);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 2))('aaaa', 3)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 2))('aaaa', 4)).toBe(NO_MATCH);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 2))('aabb', 1)).toBe(2);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 2))('aabb', 2)).toBe(NO_MATCH);
  });

  test('takes minimum number of chars', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 0))('aaaa', 0)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 0))('aaaa', 1)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 0))('aaaa', 4)).toBe(NO_MATCH);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 0))('aabb', 1)).toBe(2);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 1, 0))('aabb', 2)).toBe(NO_MATCH);
  });

  test('takes unlimited number of chars', () => {
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 0))('aaaa', 0)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 0))('aaaa', 1)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 0))('aaaa', 4)).toBe(4);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 0))('aabb', 1)).toBe(2);
    expect(toTakerFunction(new AllCharCodeRangeTaker([A], 0, 0))('aabb', 2)).toBe(2);
  });
});

describe('AllCaseSensitiveTextTaker', () => {

  test('takes sequential case-insensitive substrings', () => {
    expect(toTakerFunction(new AllCaseSensitiveTextTaker('abc', 0, 0))('abcabcabcd', 3)).toBe(9);
    expect(toTakerFunction(new AllCaseSensitiveTextTaker('abc', 3, 0))('abcabcabcd', 3)).toBe(NO_MATCH);
  });

  test('takes if count is sufficient', () => {
    expect(toTakerFunction(new AllCaseSensitiveTextTaker('ab', 2, 0))('abababc', 2)).toBe(6);
  });

  test('does not take if count is insufficient', () => {
    expect(toTakerFunction(new AllCaseSensitiveTextTaker('ab', 2, 0))('aabb', 1)).toBe(NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(toTakerFunction(new AllCaseSensitiveTextTaker('ab', 0, 2))('abababab', 2)).toBe(6);
  });

  test('stops at string end', () => {
    expect(toTakerFunction(new AllCaseSensitiveTextTaker('ab', 0, 0))('abababab', 0)).toBe(8);
  });
});

describe('AllRegexTaker', () => {

  test('takes sequential regex matches', () => {
    expect(toTakerFunction(new AllRegexTaker(/a/, 0, 0))('aaaaabaaa', 3)).toBe(5);
    expect(toTakerFunction(new AllRegexTaker(/a/, 3, 0))('aaaaabaaa', 3)).toBe(NO_MATCH);
    expect(toTakerFunction(new AllRegexTaker(/a/, 0, 3))('aaaaa', 0)).toBe(3);
  });

  test('takes if count is sufficient', () => {
    expect(toTakerFunction(new AllRegexTaker(/ab/, 2, 0))('abababc', 2)).toBe(6);
  });

  test('does not take if count is insufficient', () => {
    expect(toTakerFunction(new AllRegexTaker(/ab/, 2, 0))('aabb', 1)).toBe(NO_MATCH);
  });

  test('takes limited number of chars', () => {
    expect(toTakerFunction(new AllRegexTaker(/ab/, 0, 2))('abababab', 2)).toBe(6);
  });

  test('stops at string end', () => {
    expect(toTakerFunction(new AllRegexTaker(/ab/, 0, 0))('abababab', 0)).toBe(8);
  });
});

describe('AllTaker', () => {

  test('takes until taker returns NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(toTakerFunction(new AllTaker(takerMock, 0, 0))('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(3);
  });

  test('takes until taker returns the same offset', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(3);

    expect(toTakerFunction(new AllTaker(takerMock, 0, 0))('aabbcc', 2)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(3);

    expect(toTakerFunction(new AllTaker(takerMock, 0, 0))('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns NO_MATCH if minimum matches was not reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(toTakerFunction(new AllTaker(takerMock, 2, 0))('a', 0)).toBe(NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(toTakerFunction(new AllTaker(takerMock, 2, 0))('aaa', 0)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(4);
  });

  test('limits maximum read char count', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);

    expect(toTakerFunction(new AllTaker(takerMock, 0, 2))('aaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('maximum does not affect the minimum', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(toTakerFunction(new AllTaker(takerMock, 0, 2))('a', 0)).toBe(1);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline takers', () => {
    expect(toTakerFunction(new AllTaker(text('a'), 0, 0))('aabbcc', 0)).toBe(2);
  });
});
