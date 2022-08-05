import { all, Reader, seq, text } from '../../main';
import { compileRuleIterator, createRuleTree, TokenHandler, TokenizerState } from '../../main/rules';

describe('compileRuleIterator', () => {

  const handlerMock = jest.fn();

  const handler: TokenHandler = (type, chunk, offset, length, context, state) => {
    handlerMock(type, state.chunkOffset + offset, length, context);
  };

  beforeEach(() => {
    handlerMock.mockRestore();
  });

  test('emits tokens', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: all(text('a')) },
      { type: 'TYPE_B', reader: all(text('b')) },
    ]));

    const state: TokenizerState = {
      chunk: 'abaabb',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(4);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_B', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 2, 2, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(4, 'TYPE_B', 4, 2, undefined);

    expect(state).toEqual({
      chunk: 'abaabb',
      offset: 6,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('reads a non-empty token from the string at chunk start in streaming mode', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: text('a') },
    ]));

    const state: TokenizerState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined, true);

    expect(handlerMock).toHaveBeenCalledTimes(2);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_A', 1, 1, undefined);

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 2,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('reads a non-empty token from the string at chunk start in non-streaming mode', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: text('a') },
    ]));

    const state: TokenizerState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_A', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 2, 1, undefined);

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 3,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('reads a non-empty token from the string with offset in streaming mode', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: text('a') },
    ]));

    const state: TokenizerState = {
      chunk: 'bbaaa',
      offset: 2,
      chunkOffset: 1000,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 1002, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_A', 1003, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 1004, 1, undefined);

    expect(state).toEqual({
      chunk: 'bbaaa',
      offset: 5,
      chunkOffset: 1000,
      stage: undefined,
    });
  });

  test('respects literal stages', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: text('a'), on: ['STAGE_A'], to: 'STAGE_B' },
      { type: 'TYPE_B', reader: text('b'), on: ['STAGE_B'], to: 'STAGE_A' },
    ]));

    const state: TokenizerState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stage: 'STAGE_A',
    };

    ruleIterator(state, handler, undefined, true);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_B', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 2, 1, undefined);

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stage: 'STAGE_B',
    });
  });

  test('respects computed stages', () => {
    const ruleAToMock = jest.fn(() => 'STAGE_B');
    const ruleBToMock = jest.fn(() => 'STAGE_A');

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: text('a'), on: ['STAGE_A'], to: ruleAToMock },
      { type: 'TYPE_B', reader: text('b'), on: ['STAGE_B'], to: ruleBToMock },
    ]));

    const state: TokenizerState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stage: 'STAGE_A',
    };

    const context = Symbol('context');

    ruleIterator(state, handler, context, true);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, context);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_B', 1, 1, context);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 2, 1, context);

    expect(ruleAToMock).toHaveBeenCalledTimes(2);
    expect(ruleAToMock).toHaveBeenNthCalledWith(1, 'ababbbb', 0, 1, context, expect.anything());
    expect(ruleAToMock).toHaveBeenNthCalledWith(2, 'ababbbb', 2, 1, context, expect.anything());

    expect(ruleBToMock).toHaveBeenCalledTimes(2);
    expect(ruleBToMock).toHaveBeenNthCalledWith(1, 'ababbbb', 1, 1, context, expect.anything());
    expect(ruleBToMock).toHaveBeenNthCalledWith(2, 'ababbbb', 3, 1, context, expect.anything());

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stage: 'STAGE_B',
    });
  });

  test('optimizes rule prefixes', () => {

    const readerMock: Reader<any> = jest.fn((input, offset) => offset + 1);

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: seq(readerMock, text('a')) },
      { type: 'TYPE_B', reader: seq(readerMock, text('b')) },
    ]));

    const state: TokenizerState = {
      chunk: '_b',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(1);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_B', 0, 2, undefined);

    expect(state).toEqual({
      chunk: '_b',
      offset: 2,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('does not emit tokens for silent rules', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { type: 'TYPE_A', reader: text('a') },
      { type: 'TYPE_B', reader: text('b'), silent: true },
    ]));

    const state: TokenizerState = {
      chunk: 'ababa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_A', 2, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 4, 1, undefined);

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 5,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('state is uncorrupted when an error is thrown in a token handler', () => {

    const ruleIterator = compileRuleIterator(createRuleTree([
      { reader: text('a'), on: ['STAGE_B'], to: 'STAGE_A' },
      { reader: text('b'), on: ['STAGE_A'], to: 'STAGE_B' },
    ]));

    const state: TokenizerState = {
      chunk: 'ababa',
      offset: 0,
      chunkOffset: 0,
      stage: 'STAGE_B',
    };

    handlerMock.mockImplementationOnce(() => undefined);
    handlerMock.mockImplementationOnce(() => undefined);
    handlerMock.mockImplementationOnce(() => undefined);
    handlerMock.mockImplementationOnce(() => {
      throw new Error();
    });

    expect(() => ruleIterator(state, handler, undefined)).toThrow();

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 3,
      chunkOffset: 0,
      stage: 'STAGE_A',
    });
  });

  test('state is uncorrupted when an error is thrown in a stage provider', () => {

    const toMock = jest.fn(() => 'STAGE_B');

    const ruleIterator = compileRuleIterator(createRuleTree([
      { reader: text('a'), on: ['STAGE_B'], to: 'STAGE_A' },
      { reader: text('b'), on: ['STAGE_A'], to: toMock },
    ]));

    toMock.mockImplementationOnce(() => 'STAGE_B');
    toMock.mockImplementationOnce(() => {
      throw new Error();
    });

    const state: TokenizerState = {
      chunk: 'ababa',
      offset: 0,
      chunkOffset: 0,
      stage: 'STAGE_B',
    };

    expect(() => ruleIterator(state, handler, undefined)).toThrow();

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 3,
      chunkOffset: 0,
      stage: 'STAGE_A',
    });
  });

  test('reads computed token types', () => {

    const typeMock = jest.fn();

    const ruleIterator = compileRuleIterator(createRuleTree([
      { reader: text('a'), type: 'TYPE_A' },
      { reader: text('b'), type: typeMock },
    ]));

    typeMock.mockImplementationOnce(() => 'TYPE_B1');
    typeMock.mockImplementationOnce(() => 'TYPE_B2');

    const state: TokenizerState = {
      chunk: 'ababa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(5);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TYPE_A', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TYPE_B1', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TYPE_A', 2, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(4, 'TYPE_B2', 3, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(5, 'TYPE_A', 4, 1, undefined);

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 5,
      chunkOffset: 0,
      stage: undefined,
    });
  });
});
