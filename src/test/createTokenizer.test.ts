import {all, createTokenizer, Reader, text, TokenHandler} from '../main';

describe('createTokenizer', () => {

  const handlerMock = jest.fn();

  const handler: TokenHandler = (type, chunk, offset, length, context, state) => {
    handlerMock(type, state.chunkOffset + offset, length, context);
  };

  beforeEach(() => {
    handlerMock.mockRestore();
  });

  test('reads tokens in non-streaming mode', () => {

    const tokenizer = createTokenizer<string, void>([
      {type: 'TYPE_A', reader: text('a')},
      {type: 'TYPE_B', reader: all(text('b', {caseInsensitive: true}))},
    ]);

    const state = tokenizer('aabbb', handler);

    expect(state).toEqual({
      stage: undefined,
      chunk: 'aabbb',
      chunkOffset: 0,
      offset: 5
    });

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_A', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_B', 2, 3, undefined);
  });

  test('reads tokens in streaming mode', () => {

    const tokenizer = createTokenizer<string, void>([
      {type: 'TYPE_A', reader: text('a')},
      {type: 'TYPE_B', reader: all(text('b', {caseInsensitive: true}))},
    ]);

    const state = tokenizer.write('aabbb', undefined, handler);

    expect(handlerMock).toHaveBeenCalledTimes(2);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_A', 1, 1, undefined);

    tokenizer.write('BBB', state, handler);

    expect(handlerMock).toHaveBeenCalledTimes(2);

    tokenizer.write('a', state, handler);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_B', 2, 6, undefined);

    tokenizer(state, handler);

    expect(handlerMock).toHaveBeenCalledTimes(4);
    expect(handlerMock).toHaveBeenNthCalledWith(4, 'TYPE_A', 8, 1, undefined);
  });

  test('reads tokens with reader function', () => {
    const readerMock: Reader = jest.fn((input, offset) => offset < input.length ? offset + 1 : -1);

    const tokenizer = createTokenizer([
      {reader: readerMock},
    ]);

    tokenizer('abc', handler);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(readerMock).toHaveBeenCalledTimes(3);
  });
});
