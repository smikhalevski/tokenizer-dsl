import {all, char, Rule, text, TokenHandler, Tokenizer} from '../main';

describe('Tokenizer', () => {

  let tokenCallbackMock = jest.fn();
  let errorCallbackMock = jest.fn();
  let unrecognizedTokenCallbackMock = jest.fn();

  const handler: TokenHandler<any> = {
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
    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)]))};

    const tokenizer = new Tokenizer(
        [
          ruleA,
          ruleB,
        ],
        handler,
        undefined,
        undefined,
    );

    tokenizer.write('aabbb');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1);

    tokenizer.write('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);

    tokenizer.write('a');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeB', 2, 6);

    tokenizer.end();

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'TypeA', 8, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });

  test('can be reset', () => {
    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)]))};

    const tokenizer = new Tokenizer(
        [
          ruleA,
          ruleB,
        ],
        handler,
        undefined,
        undefined,
    );

    tokenizer.end('aab');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeB', 2, 1);

    tokenizer.reset();
    tokenizer.end('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'TypeB', 0, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });
});
