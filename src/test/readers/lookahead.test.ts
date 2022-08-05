import { lookahead, LookaheadReader, never, none, text, toReaderFunction } from '../../main/readers';

describe('lookahead', () => {

  test('returns never', () => {
    expect(lookahead(never)).toBe(never);
  });

  test('returns none', () => {
    expect(lookahead(none)).toBe(none);
  });

  test('returns LookaheadReader', () => {
    expect(lookahead(() => 0)).toBeInstanceOf(LookaheadReader);
  });
});

describe('LookaheadReader', () => {

  test('returns the current offset if reader matched', () => {
    const readerMock = jest.fn();
    readerMock.mockReturnValueOnce(10);

    expect(toReaderFunction(new LookaheadReader(readerMock))('aabbcc', 2)).toBe(2);
    expect(readerMock).toHaveBeenCalledTimes(1);
  });

  test('can use inline readers', () => {
    expect(toReaderFunction(new LookaheadReader(text('aa')))('aabbcc', 0)).toBe(0);
    expect(toReaderFunction(new LookaheadReader(text('bb')))('aabbcc', 0)).toBe(-1);
  });

  test('propagates context', () => {
    const readerMock = jest.fn(() => 0);
    const context = Symbol('context');

    expect(toReaderFunction<any>(new LookaheadReader(readerMock))('a', 0, context)).toBe(0);

    expect(readerMock).toHaveBeenCalledTimes(1);
    expect(readerMock).toHaveBeenNthCalledWith(1, 'a', 0, context);
  });
});
