import {never, NO_MATCH, none, seq, SeqReader, Reader, text, toReaderFunction} from '../../main/readers';

describe('seq', () => {

  test('returns none', () => {
    expect(seq()).toBe(none);
  });

  test('returns never', () => {
    expect(seq(never)).toBe(never);
    expect(seq(text('a'), never)).toBe(never);
  });

  test('returns reader', () => {
    const readerMock: Reader<any> = () => 0;
    expect(seq(readerMock)).toBe(readerMock);
  });

  test('returns SeqReader', () => {
    expect(seq(text('aaa'), text('bbb'))).toBeInstanceOf(SeqReader);
  });
});

describe('SeqReader', () => {

  test('fails if any of readers fail', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(4);
    readerMock.mockReturnValueOnce(NO_MATCH);
    readerMock.mockReturnValueOnce(5);

    expect(toReaderFunction(new SeqReader([readerMock, readerMock, readerMock]))('aabbcc', 2)).toBe(NO_MATCH);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('allows readers to return the same offset', () => {
    expect(toReaderFunction(new SeqReader([() => 2, () => 4]))('aabbcc', 2)).toBe(4);
  });

  test('returns error result', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(4);
    readerMock.mockReturnValueOnce(-2);
    readerMock.mockReturnValueOnce(5);

    expect(toReaderFunction(new SeqReader([readerMock, readerMock, readerMock]))('aabbcc', 2)).toBe(-2);
    expect(readerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new SeqReader([text('aa'), text('bb')]))('aabbcc', 0)).toBe(4);
  });
});
