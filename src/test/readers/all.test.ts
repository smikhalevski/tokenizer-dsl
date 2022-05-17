import {all, AllReader, never, NO_MATCH, none, text, toReaderFunction} from '../../main/readers';

describe('all', () => {

  test('returns never', () => {
    expect(all(never)).toBe(never);
    expect(all(never, {minimumCount: Infinity})).toBe(never);
  });

  test('throws if minimum is greater than maximum', () => {
    expect(() => all(never, {minimumCount: 2, maximumCount: 1})).toThrow();
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

describe('AllReader', () => {

  test('reads until reader returns NO_MATCH', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(4);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 0, 0, 2))('aabbcc', 2)).toBe(4);
    expect(readerMock).toHaveBeenCalledTimes(3);
  });

  test('reads until reader returns the same offset', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(3);

    expect(toReaderFunction(new AllReader(readerMock, 0, 0, 2))('aabbcc', 2)).toBe(3);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying reader', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce('Error');
    readerMock.mockReturnValueOnce(3);

    expect(toReaderFunction(new AllReader(readerMock, 0, 0, 2))('aabbcc', 2)).toBe('Error');
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns NO_MATCH if minimum matches was not reached', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 2, 0, 2))('a', 0)).toBe(NO_MATCH);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(2);
    readerMock.mockReturnValueOnce(3);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 2, 0, 2))('aaa', 0)).toBe(3);
    expect(readerMock).toHaveBeenCalledTimes(4);
  });

  test('limits maximum read char count', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(2);
    readerMock.mockReturnValueOnce(3);

    expect(toReaderFunction(new AllReader(readerMock, 0, 2, 2))('aaa', 0)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('maximum does not affect the minimum', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(1);
    readerMock.mockReturnValueOnce(NO_MATCH);

    expect(toReaderFunction(new AllReader(readerMock, 0, 2, 2))('a', 0)).toBe(1);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new AllReader(text('a'), 0, 0, 2))('aabbcc', 0)).toBe(2);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new AllReader(readerMock, 0, 0, 2))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
