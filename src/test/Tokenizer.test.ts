import {all, char, rule, text, RuleHandler, Tokenizer} from '../main';

describe('Tokenizer', () => {

  let tokenCallbackMock = jest.fn();
  let errorCallbackMock = jest.fn();
  let unrecognizedTokenCallbackMock = jest.fn();

  const handler: RuleHandler<unknown> = {
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
    const ruleA = rule(text('a'));
    const ruleB = rule(all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)])));

    const tokenizer = new Tokenizer([
      ruleA,
      ruleB,
    ], handler);

    tokenizer.write('aabbb');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 2);

    tokenizer.write('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);

    tokenizer.write('a');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleB, 2, 8);

    tokenizer.end();

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, ruleA, 8, 9);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });

  test('can be reset', () => {
    const ruleA = rule(text('a'));
    const ruleB = rule(all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)])));

    const tokenizer = new Tokenizer([
      ruleA,
      ruleB,
    ], handler);

    tokenizer.end('aab');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleB, 2, 3);

    tokenizer.reset();
    tokenizer.end('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, ruleB, 0, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });
});
