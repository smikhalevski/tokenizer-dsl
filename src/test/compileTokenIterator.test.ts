import {all, createToken, text, TokenHandler} from '../main';
import {compileTokenIterator, TokenIteratorState} from '../main/compileTokenIterator';

describe('compileTokenIterator', () => {

  let tokenCallbackMock = jest.fn();
  let errorCallbackMock = jest.fn();
  let unrecognizedTokenCallbackMock = jest.fn();

  const handler: TokenHandler = {
    token: tokenCallbackMock,
    error: errorCallbackMock,
    unrecognizedToken: unrecognizedTokenCallbackMock,
  };

  beforeEach(() => {
    tokenCallbackMock.mockRestore();
    errorCallbackMock.mockRestore();
    unrecognizedTokenCallbackMock.mockRestore();
  });

  test('emits tokens', () => {

    const tokenA = createToken(all(text('a')));
    const tokenB = createToken(all(text('b')));

    const tokenIterator = compileTokenIterator([
      tokenA,
      tokenB,
    ]);

    const state: TokenIteratorState = {
      chunk: 'abaabb',
      offset: 0,
      chunkOffset: 0,
      stage: -1,
    };

    tokenIterator(state, false, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, tokenA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, tokenB, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, tokenA, 2, 4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, tokenB, 4, 6);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'abaabb',
      offset: 6,
      chunkOffset: 0,
      stage: -1,
    });
  });

  test('reads a non-empty token from the string at chunk start in streaming mode', () => {
    const token = createToken(text('a'));
    const tokenIterator = compileTokenIterator([token]);

    const state: TokenIteratorState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stage: -1,
    };

    tokenIterator(state, true, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, token, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, token, 1, 2);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 2,
      chunkOffset: 0,
      stage: -1,
    });
  });

  test('reads a non-empty token from the string at chunk start in non-streaming mode', () => {
    const token = createToken(text('a'));
    const tokenIterator = compileTokenIterator([token]);

    const state: TokenIteratorState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stage: -1,
    };

    tokenIterator(state, false, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, token, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, token, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, token, 2, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 3,
      chunkOffset: 0,
      stage: -1,
    });
  });

  test('reads a non-empty token from the string with offset in streaming mode', () => {
    const token = createToken(text('a'));
    const tokenIterator = compileTokenIterator([token]);

    const state: TokenIteratorState = {
      chunk: 'bbaaa',
      offset: 2,
      chunkOffset: 1000,
      stage: -1,
    };

    tokenIterator(state, false, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, token, 1002, 1003);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, token, 1003, 1004);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, token, 1004, 1005);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaa',
      offset: 5,
      chunkOffset: 1000,
      stage: -1,
    });
  });

  test('triggers unrecognizedToken in non-streaming mode', () => {
    const token = createToken(text('a'));
    const tokenIterator = compileTokenIterator([token]);

    const state: TokenIteratorState = {
      chunk: 'bbaac',
      offset: 2,
      chunkOffset: 1000,
      stage: -1,
    };

    tokenIterator(state, false, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, token, 1002, 1003);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, token, 1003, 1004);

    expect(errorCallbackMock).not.toHaveBeenCalled();

    expect(unrecognizedTokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(unrecognizedTokenCallbackMock).toHaveBeenNthCalledWith(1, 1004);

    expect(state).toEqual({
      chunk: 'bbaac',
      offset: 4,
      chunkOffset: 1000,
      stage: -1,
    });
  });

  test('triggers error in streaming mode', () => {
    const tokenA = createToken(text('aaa'));
    const tokenC = createToken(text('cc'));
    const tokenError = createToken(() => -777);
    const tokenIterator = compileTokenIterator([tokenA, tokenC, tokenError]);

    const state: TokenIteratorState = {
      chunk: 'bbaaacceee',
      offset: 2,
      chunkOffset: 1000,
      stage: -1,
    };

    tokenIterator(state, false, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, tokenA, 1002, 1005);
    // tokenB is not triggered because no confirmation was given

    expect(errorCallbackMock).toHaveBeenCalledTimes(1);
    expect(errorCallbackMock).toHaveBeenNthCalledWith(1, tokenError, 1007, -777);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaacceee',
      offset: 5,
      chunkOffset: 1000,
      stage: -1,
    });
  });

  test('respects stages', () => {
    const tokenA = createToken(text('a'), ['A'], 'B');
    const tokenB = createToken(text('b'), ['B'], 'A');

    const tokenIterator = compileTokenIterator([tokenA, tokenB]);

    const state: TokenIteratorState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stage: tokenIterator.uniqueStages.indexOf('A'),
    };

    tokenIterator(state, true, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, tokenA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, tokenB, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, tokenA, 2, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stage: 1,
    });
  });
});
