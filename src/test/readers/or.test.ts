import {NO_MATCH, none, or, OrReader, Reader, text, toReaderFunction} from '../../main/readers';

describe('or', () => {

  test('returns none reader', () => {
    expect(or()).toBe(none);
  });

  test('returns single reader', () => {
    const readerMock: Reader<any, any> = () => 0;
    expect(or(readerMock)).toBe(readerMock);
  });

  test('returns OrReader', () => {
    const readerMock = jest.fn();
    expect(or(readerMock, readerMock)).toBeInstanceOf(OrReader);
  });
});

describe('OrReader', () => {

  test('returns after the first match', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(2);
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new OrReader([readerMock, readerMock, readerMock]))('aabbcc', 0)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns NO_MATCH', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValue(NO_MATCH);

    expect(toReaderFunction(new OrReader([readerMock, readerMock]))('aabbcc', 2)).toBe(NO_MATCH);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns negative integer as an error result', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(-2);
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new OrReader([readerMock, readerMock]))('aabbcc', 2)).toBe(-2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('returns non number value as an error result', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce('123');
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new OrReader([readerMock, readerMock]))('aabbcc', 2)).toBe('123');
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new OrReader([text('bb'), text('aa')]))('aabbcc', 0)).toBe(2);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new OrReader([readerMock, readerMock]))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
