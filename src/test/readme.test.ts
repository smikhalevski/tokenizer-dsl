import {all, char, createTokenizer, maybe, or, Rule, seq, text, TokenHandler} from '../main';

describe('Readme', () => {

  const tokenCallbackMock = jest.fn();
  const errorCallbackMock = jest.fn();
  const unrecognizedTokenCallbackMock = jest.fn();

  const handler: TokenHandler = {
    token(type, chunk, offset, length, context, state) {
      tokenCallbackMock(type, state.chunkOffset + offset, length, context);
    },
    unrecognizedToken(chunk, offset, context, state) {
      unrecognizedTokenCallbackMock(state.chunkOffset + offset, context);
    }
  };

  beforeEach(() => {
    tokenCallbackMock.mockRestore();
    errorCallbackMock.mockRestore();
    unrecognizedTokenCallbackMock.mockRestore();
  });

  test('Overview', () => {
    const zeroReader = text('0');

    const leadingDigitReader = char([['1', '9']]);

    const digitsReader = all(char([['0', '9']]));

    const dotReader = text('.');

    const signReader = char(['+-']);

    const numberReader = seq(
        // sign
        maybe(signReader),

        // integer
        or(
            zeroReader,
            seq(
                leadingDigitReader,
                digitsReader,
            ),
        ),

        // fraction
        maybe(
            seq(
                dotReader,
                maybe(digitsReader),
            ),
        ),
    );

    const semicolonReader = text(';');

    const whitespaceReader = all(char([' \t\r\n']));

    const tokenizer = createTokenizer<'NUMBER', 'value' | 'separator'>(
        [
          {
            on: ['value'],
            type: 'NUMBER',
            reader: numberReader,
            to: 'separator'
          },
          {
            on: ['separator'],
            reader: semicolonReader,
            silent: true,
            to: 'value'
          },
          {
            reader: whitespaceReader,
            silent: true
          }
        ],
        'value'
    );

    const state = tokenizer.write('123', handler);
    tokenizer.write('.456; +', handler, state);
    tokenizer.write('777; 42', handler, state);
    tokenizer.end(handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'NUMBER', 0, 7, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'NUMBER', 9, 4, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'NUMBER', 15, 2, undefined);
  });

  test('Usage', () => {

    const alphaReader = all(char([['a', 'z']]), {minimumCount: 1});

    const integerReader = or(
        text('0'),
        seq(
            char([['1', '9']]),
            all(char([['0', '9']]))
        ),
    );

    const semicolonReader = text(';');

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

    tokenize('foo;123;bar;456', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(7);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'ALPHA', 0, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'SEMICOLON', 3, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'INTEGER', 4, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'SEMICOLON', 7, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(5, 'ALPHA', 8, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(6, 'SEMICOLON', 11, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(7, 'INTEGER', 12, 3, undefined);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    tokenCallbackMock.mockReset();

    tokenize('abcd__', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'ALPHA', 0, 4, undefined);

    expect(unrecognizedTokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(unrecognizedTokenCallbackMock).toHaveBeenNthCalledWith(1, 4, undefined);
  });

  test('Stages', () => {
    type MyTokenType = 'FOO' | 'BAR';

    type MyStage = 'start' | 'foo' | 'bar';

    const fooRule: Rule<MyTokenType, MyStage> = {
      on: ['start', 'bar'],
      type: 'FOO',
      reader: text('foo'),
      to: 'foo'
    };

    const barRule: Rule<MyTokenType, MyStage> = {
      on: ['start', 'foo'],
      type: 'BAR',
      reader: text('bar'),
      to: 'bar'
    };

    const tokenize = createTokenizer(
        [
          fooRule,
          barRule
        ],
        'start'
    );

    tokenize('foobarfoobar', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'FOO', 0, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'BAR', 3, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'FOO', 6, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'BAR', 9, 3, undefined);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    tokenCallbackMock.mockReset();

    tokenize('foofoo', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'FOO', 0, 3, undefined);

    expect(unrecognizedTokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(unrecognizedTokenCallbackMock).toHaveBeenNthCalledWith(1, 3, undefined);
  });

  test('Undefined stages', () => {
    type MyTokenType = 'FOO' | 'BAR' | 'SPACE';

    type MyStage = 'start' | 'foo' | 'bar';

    const fooRule: Rule<MyTokenType, MyStage> = {
      on: ['start', 'bar'],
      type: 'FOO',
      reader: text('foo'),
      to: 'foo'
    };

    const barRule: Rule<MyTokenType, MyStage> = {
      on: ['start', 'foo'],
      type: 'BAR',
      reader: text('bar'),
      to: 'bar'
    };

    const spaceReader: Rule<MyTokenType, MyStage> = {
      type: 'SPACE',
      reader: all(char([' '])),
    };

    const tokenize = createTokenizer(
        [
          fooRule,
          barRule,
          spaceReader
        ],
        'start'
    );

    tokenize('foo  bar  foo  bar', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(7);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'FOO', 0, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'SPACE', 3, 2, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'BAR', 5, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'SPACE', 8, 2, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(5, 'FOO', 10, 3, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(6, 'SPACE', 13, 2, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(7, 'BAR', 15, 3, undefined);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });
});