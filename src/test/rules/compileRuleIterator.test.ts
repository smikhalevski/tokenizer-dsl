import {all, Reader, Rule, seq, text} from '../../main';
import {compileRuleIterator, createRuleTree, TokenHandler, TokenizerState} from '../../main/rules';

describe('compileRuleIterator', () => {

  const handlerMock = jest.fn();

  const handler: TokenHandler<any, any> = (type, chunk, offset, length, context, state) => {
    handlerMock(type, state.chunkOffset + offset, length, context);
  };

  beforeEach(() => {
    handlerMock.mockRestore();
  });

  test('emits tokens', () => {

    const ruleA: Rule = {type: 'TypeA', reader: all(text('a'))};
    const ruleB: Rule = {type: 'TypeB', reader: all(text('b'))};

    const ruleIterator = compileRuleIterator(createRuleTree([
      ruleA,
      ruleB,
    ]));

    const state: TokenizerState = {
      chunk: 'abaabb',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(4);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 2, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(4, 'TypeB', 4, 2, undefined);

    expect(state).toEqual({
      chunk: 'abaabb',
      offset: 6,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('reads a non-empty token from the string at chunk start in streaming mode', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleTree([ruleA]));

    const state: TokenizerState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined, true);

    expect(handlerMock).toHaveBeenCalledTimes(2);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1, undefined);

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 2,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('reads a non-empty token from the string at chunk start in non-streaming mode', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleTree([ruleA]));

    const state: TokenizerState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1, undefined);

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 3,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('reads a non-empty token from the string with offset in streaming mode', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleTree([ruleA]));

    const state: TokenizerState = {
      chunk: 'bbaaa',
      offset: 2,
      chunkOffset: 1000,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeA', 1003, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TypeA', 1004, 1, undefined);

    expect(state).toEqual({
      chunk: 'bbaaa',
      offset: 5,
      chunkOffset: 1000,
      stage: undefined,
    });
  });

  test('respects literal stages', () => {
    const ruleA: Rule<string, string> = {type: 'TypeA', reader: text('a'), on: ['A'], to: 'B'};
    const ruleB: Rule<string, string> = {type: 'TypeB', reader: text('b'), on: ['B'], to: 'A'};

    const ruleIterator = compileRuleIterator(createRuleTree([ruleA, ruleB]));

    const state: TokenizerState<string> = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stage: 'A',
    };

    ruleIterator(state, handler, undefined, true);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1, undefined);

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stage: 'B',
    });
  });

  test('respects computed stages', () => {
    const ruleAToMock = jest.fn(() => 'B');
    const ruleBToMock = jest.fn(() => 'A');

    const ruleA: Rule<string, string, symbol> = {type: 'TypeA', reader: text('a'), on: ['A'], to: ruleAToMock};
    const ruleB: Rule<string, string, symbol> = {type: 'TypeB', reader: text('b'), on: ['B'], to: ruleBToMock};

    const ruleIterator = compileRuleIterator(createRuleTree([ruleA, ruleB]));

    const state: TokenizerState<string> = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stage: 'A',
    };

    const context = Symbol('context');

    ruleIterator(state, handler, context, true);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, context);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1, context);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1, context);

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
      stage: 'B',
    });
  });

  test('optimizes rule prefixes', () => {

    const prefixReaderMock: Reader<any> = jest.fn((input, offset) => offset + 1);

    const ruleA: Rule = {type: 'TypeA', reader: seq(prefixReaderMock, text('a'))};
    const ruleB: Rule = {type: 'TypeB', reader: seq(prefixReaderMock, text('b'))};

    const ruleIterator = compileRuleIterator(createRuleTree([ruleA, ruleB]));

    const state: TokenizerState = {
      chunk: '_b',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(1);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeB', 0, 2, undefined);

    expect(state).toEqual({
      chunk: '_b',
      offset: 2,
      chunkOffset: 0,
      stage: undefined,
    });
  });

  test('does not emit tokens for silent rules', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule = {type: 'TypeB', reader: text('b'), silent: true};

    const ruleIterator = compileRuleIterator(createRuleTree([ruleA, ruleB]));

    const state: TokenizerState = {
      chunk: 'ababa',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(handlerMock).toHaveBeenCalledTimes(3);
    expect(handlerMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(2, 'TypeA', 2, 1, undefined);
    expect(handlerMock).toHaveBeenNthCalledWith(3, 'TypeA', 4, 1, undefined);

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 5,
      chunkOffset: 0,
      stage: undefined,
    });
  });
});
