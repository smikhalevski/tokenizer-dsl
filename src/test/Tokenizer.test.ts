import {all, char, createToken, text, TokenHandler, Tokenizer} from '../main';

describe('Tokenizer', () => {

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

  test('reads streaming tokens', () => {
    const tokenA = createToken(text('a'));
    const tokenB = createToken(all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)])));

    const tokenizer = new Tokenizer([
      tokenA,
      tokenB,
    ], handler);

    tokenizer.write('aabbb');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, tokenA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, tokenA, 1, 2);

    tokenizer.write('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);

    tokenizer.write('a');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, tokenB, 2, 8);

    tokenizer.end();

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, tokenA, 8, 9);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });

  test('can be reset', () => {
    const tokenA = createToken(text('a'));
    const tokenB = createToken(all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)])));

    const tokenizer = new Tokenizer([
      tokenA,
      tokenB,
    ], handler);

    tokenizer.end('aab');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, tokenA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, tokenA, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, tokenB, 2, 3);

    tokenizer.reset();
    tokenizer.end('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, tokenB, 0, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });
});
