import {
  all,
  AllCharCodeRangeReader,
  AllReader,
  never,
  NO_MATCH,
  none,
  text,
  toReaderFunction
} from '../../main/readers';

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

  test('returns unlimited reader', () => {
    expect(all(() => 0, {maximumCount: -1})).toBeInstanceOf(AllReader);
    expect(all(() => 0, {maximumCount: 0})).toBeInstanceOf(AllReader);
  });

  test('returns reader', () => {
    const baseReaderMock = () => 0;
    expect(all(baseReaderMock, {minimumCount: 1, maximumCount: 1})).toBe(baseReaderMock);
  });

  test('returns AllReader', () => {
    expect(all(() => 0)).toBeInstanceOf(AllReader);
  });
});

describe('AllCharCodeRangeReader', () => {

  test('reads exact number of chars', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 2, 2))('aaaa', 0)).toBe(2);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 2, 2))('aaaa', 1)).toBe(3);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 2, 2))('aaaa', 2)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 2, 2))('abbb', 0)).toBe(NO_MATCH);
  });

  test('reads exact number of chars when length is insufficient', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 2, 2))('aaaa', 3)).toBe(NO_MATCH);
  });

  test('reads maximum number of chars', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 2))('aaaa', 0)).toBe(2);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 2))('aaaa', 1)).toBe(3);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 2))('abbb', 0)).toBe(1);
  });

  test('reads maximum number of chars does not overflow input length', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 2))('aaaa', 3)).toBe(4);
  });

  test('reads minimum and maximum number of chars', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 2))('aaaa', 0)).toBe(2);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 2))('aaaa', 1)).toBe(3);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 2))('aaaa', 3)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 2))('aaaa', 4)).toBe(NO_MATCH);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 2))('aabb', 1)).toBe(2);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 2))('aabb', 2)).toBe(NO_MATCH);
  });

  test('reads minimum number of chars', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 0))('aaaa', 0)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 0))('aaaa', 1)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 0))('aaaa', 4)).toBe(NO_MATCH);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 0))('aabb', 1)).toBe(2);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 1, 0))('aabb', 2)).toBe(NO_MATCH);
  });

  test('reads unlimited number of chars', () => {
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 0))('aaaa', 0)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 0))('aaaa', 1)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 0))('aaaa', 4)).toBe(4);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 0))('aabb', 1)).toBe(2);
    expect(toReaderFunction(new AllCharCodeRangeReader([A], 0, 0))('aabb', 2)).toBe(2);
  });
});

describe('AllReader', () => {

  test('reads until reader returns NO_MATCH', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(4);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 0, 0))('aabbcc', 2)).toBe(4);
    expect(readerMock).toHaveBeenCalledTimes(3);
  });

  test('reads until reader returns the same offset', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(3);

    expect(toReaderFunction(new AllReader(readerMock, 0, 0))('aabbcc', 2)).toBe(3);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying reader', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(-2);
    readerMock.mockReturnValueOnce(3);

    expect(toReaderFunction(new AllReader(readerMock, 0, 0))('aabbcc', 2)).toBe(-2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns NO_MATCH if minimum matches was not reached', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 2, 0))('a', 0)).toBe(NO_MATCH);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(2);
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 2, 0))('aaa', 0)).toBe(3);
    expect(readerMock).toHaveBeenCalledTimes(4);
  });

  test('limits maximum read char count', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(2);
    readerMock.mockReturnValueOnce(3);

    expect(toReaderFunction(new AllReader(readerMock, 0, 2))('aaa', 0)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('maximum does not affect the minimum', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 0, 2))('a', 0)).toBe(1);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new AllReader(text('a'), 0, 0))('aabbcc', 0)).toBe(2);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new AllReader(readerMock, 0, 0))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
