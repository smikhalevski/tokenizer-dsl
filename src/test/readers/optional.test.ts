import { never, none, optional, OptionalReader, text, toReaderFunction } from '../../main/readers';

describe('optional', () => {

  test('returns none', () => {
    expect(optional(never)).toBe(none);
    expect(optional(none)).toBe(none);
  });

  test('returns OptionalReader', () => {
    expect(optional(() => 0)).toBeInstanceOf(OptionalReader);
  });
});

describe('OptionalReader', () => {

  test('returns result of reader', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new OptionalReader(readerMock))('aabbcc', 2)).toBe(4);
    expect(readerMock).toHaveBeenCalledTimes(1);
  });

  test('returns offset if reader did not match', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(-1);

    expect(toReaderFunction(new OptionalReader(readerMock))('aabbcc', 2)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(1);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new OptionalReader(text('aa')))('aabbcc', 0)).toBe(2);
    expect(toReaderFunction(new OptionalReader(text('bb')))('aabbcc', 0)).toBe(0);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new OptionalReader(readerMock))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
