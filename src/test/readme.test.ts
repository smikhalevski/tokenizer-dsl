import {all, char, createTokenizer, or, Rule, seq, text} from '../main';

describe('readme', () => {

  test('', () => {

    const input = 'abcd,1234,efgh,5678';

    const alphaReader = all(char([['a', 'z']]), {minimumCount: 1});

    const integerReader = or(
        text('0'),
        seq(
            char([['1', '9']]),
            all(char([['0', '9']]))
        ),
    );

    const semicolonReader = text(',');

    const alphaRule: Rule = {
      type: 'ALPHA',
      reader: alphaReader,
    };

    const integerRule: Rule = {
      type: 'INTEGER',
      reader: integerReader,
    };

    const semicolonRule: Rule = {
      type: 'SEMICOLON',
      reader: semicolonReader,
    };

    const tokenize = createTokenizer([
      alphaRule,
      integerRule,
      semicolonRule,
    ]);

    const tokenCallbackMock = jest.fn();
    const unrecognizedTokenCallbackMock = jest.fn();

    const handler = {
      token: tokenCallbackMock,
      unrecognizedToken: unrecognizedTokenCallbackMock,
    };

    tokenize(input, handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(7);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1,'ALPHA', 0, 4, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2,'SEMICOLON', 4, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3,'INTEGER', 5, 4, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4,'SEMICOLON', 9, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(5,'ALPHA', 10, 4, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(6,'SEMICOLON', 14, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(7,'INTEGER', 15, 4, undefined);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    tokenCallbackMock.mockReset();

    tokenize('abcd__', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1,'ALPHA', 0, 4, undefined);

    expect(unrecognizedTokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(unrecognizedTokenCallbackMock).toHaveBeenNthCalledWith(1, 4, undefined);
  });
});