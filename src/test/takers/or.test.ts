import {NO_MATCH, none, or, OrReader, Reader, text, toReaderFunction} from '../../main/readers';

describe('or', () => {

  test('returns none reader', () => {
    expect(or()).toBe(none);
  });

  test('returns single reader', () => {
    const readerMock: Reader<any> = () => 0;
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

  test('returns error result', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(-2);
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new OrReader([readerMock, readerMock]))('aabbcc', 2)).toBe(-2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new OrReader([text('bb'), text('aa')]))('aabbcc', 0)).toBe(2);
  });
});
