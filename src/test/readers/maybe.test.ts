import {maybe, MaybeReader, never, none, text, toReaderFunction} from '../../main/readers';

describe('maybe', () => {

  test('returns none', () => {
    expect(maybe(never)).toBe(none);
    expect(maybe(none)).toBe(none);
  });

  test('returns MaybeReader', () => {
    expect(maybe(() => 0)).toBeInstanceOf(MaybeReader);
  });
});

describe('MaybeReader', () => {

  test('returns result of reader', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(4);

    expect(toReaderFunction(new MaybeReader(readerMock))('aabbcc', 2)).toBe(4);
    expect(readerMock).toHaveBeenCalledTimes(1);
  });

  test('returns offset if reader did not match', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(-1);

    expect(toReaderFunction(new MaybeReader(readerMock))('aabbcc', 2)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(1);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new MaybeReader(text('aa')))('aabbcc', 0)).toBe(2);
    expect(toReaderFunction(new MaybeReader(text('bb')))('aabbcc', 0)).toBe(0);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new MaybeReader(readerMock))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
