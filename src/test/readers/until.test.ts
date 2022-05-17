import {
  char,
  never,
  NO_MATCH,
  none,
  text,
  toReaderFunction,
  until,
  UntilCaseSensitiveTextReader,
  UntilCharCodeRangeReader,
  UntilReader
} from '../../main/readers';

const B = 'b'.charCodeAt(0);

describe('until', () => {

  test('returns none', () => {
    expect(until(none)).toBe(none);
  });

  test('returns never', () => {
    expect(until(never)).toBe(never);
  });

  test('returns UntilCaseSensitiveTextReader', () => {
    expect(until(text('a'))).toBeInstanceOf(UntilCaseSensitiveTextReader);
    expect(until(text('aaa'))).toBeInstanceOf(UntilCaseSensitiveTextReader);
  });

  test('returns UntilCharCodeRangeReader', () => {
    expect(until(char([97, 98]))).toBeInstanceOf(UntilCharCodeRangeReader);
  });

  test('returns UntilReader', () => {
    expect(until(() => 0)).toBeInstanceOf(UntilReader);
  });
});

describe('UntilCharCodeRangeReader', () => {

  test('reads chars until char code is met', () => {
    expect(toReaderFunction(new UntilCharCodeRangeReader([[B, B]], false, 1))('aaabbb', 0)).toBe(3);
  });

  test('reads chars including the searched char', () => {
    expect(toReaderFunction(new UntilCharCodeRangeReader([[B, B]], true, 1))('aaabbb', 0)).toBe(4);
  });
});

describe('UntilCaseSensitiveTextReader', () => {

  test('reads chars until substr is met', () => {
    expect(toReaderFunction(new UntilCaseSensitiveTextReader('b', false))('aaabbb', 0)).toBe(3);
  });

  test('reads chars including substr', () => {
    expect(toReaderFunction(new UntilCaseSensitiveTextReader('b', true))('aaabbb', 0)).toBe(4);
  });
});

describe('UntilReader', () => {

  test('advances reader by one char on each iteration', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new UntilReader(readerMock, false, 1))('aaaa', 0)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(3);
    expect(readerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2, undefined);
  });

  test('reads inclusive', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(77);

    expect(toReaderFunction(new UntilReader(readerMock, true, 1))('aaaa', 0)).toBe(77);
    expect(readerMock).toHaveBeenCalledTimes(3);
    expect(readerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2, undefined);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new UntilReader(text('bb'), false, 1))('aabbcc', 0)).toBe(2);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new UntilReader(readerMock, false, 1))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
