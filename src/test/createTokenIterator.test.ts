import {all, createToken, text} from '../main';
import {createTokenIterator, TokenIteratorState} from '../main/createTokenIterator';

describe('Tokenizer', () => {

  test('emits tokens', () => {

    const tokenA = createToken(all(text('a')));
    const tokenB = createToken(all(text('b')));

    const iter = createTokenIterator([
      tokenA,
      tokenB,
    ]);

    const state: TokenIteratorState = {
      chunk: 'abaabb',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    const handlerMock = jest.fn();

    iter(state, false, handlerMock);

    expect(handlerMock).toHaveBeenCalledTimes(4);
    expect(handlerMock).toHaveBeenNthCalledWith(1, tokenA, 0, 1);
    expect(handlerMock).toHaveBeenNthCalledWith(2, tokenB, 1, 2);
    expect(handlerMock).toHaveBeenNthCalledWith(3, tokenA, 2, 4);
    expect(handlerMock).toHaveBeenNthCalledWith(4, tokenB, 4, 6);

    expect(state).toEqual({
      chunk: 'abaabb',
      offset: 6,
      chunkOffset: 0,
      stage: undefined,
    });
  });
});
