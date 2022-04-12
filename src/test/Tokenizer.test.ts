import {all, char, createRule, RuleHandler, text, Tokenizer} from '../main';

describe('Tokenizer', () => {

  let tokenCallbackMock = jest.fn();
  let errorCallbackMock = jest.fn();
  let unrecognizedTokenCallbackMock = jest.fn();

  const handler: RuleHandler<unknown, void> = {
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
    const ruleA = createRule(text('a'));
    const ruleB = createRule(all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)])));

    const tokenizer = new Tokenizer([
      ruleA,
      ruleB,
    ], handler, undefined);

    tokenizer.write('aabbb');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 1);

    tokenizer.write('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);

    tokenizer.write('a');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleB, 2, 6);

    tokenizer.end();

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, ruleA, 8, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });

  test('can be reset', () => {
    const ruleA = createRule(text('a'));
    const ruleB = createRule(all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)])));

    const tokenizer = new Tokenizer([
      ruleA,
      ruleB,
    ], handler, undefined);

    tokenizer.end('aab');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleB, 2, 1);

    tokenizer.reset();
    tokenizer.end('BBB');

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, ruleB, 0, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });
});
