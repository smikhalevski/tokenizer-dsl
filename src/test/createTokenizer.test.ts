import {all, char, createTokenizer, Rule, text, TokenHandler} from '../main';

describe('createTokenizer', () => {

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
    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule = {type: 'TypeB', reader: all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)]))};

    const tokenizer = createTokenizer(
        [
          ruleA,
          ruleB,
        ],
    );

    const state = tokenizer.write('aabbb', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1);

    tokenizer.write('BBB', handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);

    tokenizer.write('a', handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeB', 2, 6);

    tokenizer.end(handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'TypeA', 8, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });
});
