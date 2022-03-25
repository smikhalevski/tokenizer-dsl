import {all, createReader, Handler, text, Tokenizer} from '../main';

describe('Tokenizer', () => {

  test('emits tokens', () => {
    const onTokenMock = jest.fn();
    const onErrorMock = jest.fn();
    const onUnrecognizedTokenMock = jest.fn();

    const handler: Handler<unknown> = {
      onToken: onTokenMock,
      onError: onErrorMock,
      onUnrecognizedToken: onUnrecognizedTokenMock,
    };

    const readerA = createReader('A', all(text('a'), {minimumCount: 1}));
    const readerB = createReader('B', all(text('b'), {minimumCount: 1}));

    const tokenizer = new Tokenizer([readerA, readerB], undefined);

    tokenizer.end('abaabb', handler);

    expect(onTokenMock).toHaveBeenCalledTimes(4);
    expect(onTokenMock).toHaveBeenNthCalledWith(1, readerA, 0, 1);
    expect(onTokenMock).toHaveBeenNthCalledWith(2, readerB, 1, 2);
    expect(onTokenMock).toHaveBeenNthCalledWith(3, readerA, 2, 4);
    expect(onTokenMock).toHaveBeenNthCalledWith(4, readerB, 4, 6);
  });
});
