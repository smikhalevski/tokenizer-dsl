import {all, char, createTokenizer, ReaderFunction, Rule, text, TokenHandler} from '../main';

describe('createTokenizer', () => {

  const tokenCallbackMock = jest.fn();
  const errorCallbackMock = jest.fn();
  const unrecognizedTokenCallbackMock = jest.fn();

  const handler: TokenHandler = {
    token(type, chunk, offset, length, context, state) {
      tokenCallbackMock(type, state.chunkOffset + offset, length, context);
    },
    error(type, chunk, offset, errorCode, context, state) {
      errorCallbackMock(type, state.chunkOffset + offset, errorCode, context);
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

  test('reads tokens', () => {
    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule = {type: 'TypeB', reader: all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)]))};

    const tokenizer = createTokenizer([
      ruleA,
      ruleB,
    ]);

    const state = tokenizer('aabbb', handler);

    expect(state).toEqual({
      stage: undefined,
      chunk: 'aabbb',
      chunkOffset: 0,
      offset: 5
    });

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeB', 2, 3, undefined);
  });

  test('reads tokens', () => {
    const rule: Rule = {type: 'TypeA', reader: text('a')};

    const tokenizer = createTokenizer([rule]);

    const state1 = tokenizer.write('aaa', handler);
    const state2 = tokenizer.write('aaa', handler, state1);
    const state3 = tokenizer.end(handler, state2);

    expect(state1).not.toBe(state2);
    expect(state2).not.toBe(state3);
  });

  test('reads streaming tokens', () => {
    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule = {type: 'TypeB', reader: all(char(['b'.charCodeAt(0), 'B'.charCodeAt(0)]))};

    const tokenizer = createTokenizer([
      ruleA,
      ruleB,
    ]);

    let state;

    state = tokenizer.write('aabbb', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1, undefined);

    state = tokenizer.write('BBB', handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);

    state = tokenizer.write('a', handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeB', 2, 6, undefined);

    tokenizer.end(handler, state);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'TypeA', 8, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();
  });

  test('reads tokens with reader function', () => {
    const readerMock: ReaderFunction<void, number> = jest.fn((input, offset) => {
      return offset < input.length ? offset + 1 : -1;
    });

    const rule: Rule = {type: 'TypeA', reader: readerMock};

    const tokenizer = createTokenizer([rule]);

    tokenizer('abc', handler);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(readerMock).toHaveBeenCalledTimes(3);
  });
});
