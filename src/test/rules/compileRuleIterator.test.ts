import {all, ReaderFunction, Rule, seq, text} from '../../main';
import {compileRuleIterator, createRuleTree, TokenHandler, TokenizerState} from '../../main/rules';

describe('compileRuleIterator', () => {

  let tokenCallbackMock = jest.fn();
  let errorCallbackMock = jest.fn();
  let unrecognizedTokenCallbackMock = jest.fn();

  const handler: TokenHandler<any, any> = {
    token: tokenCallbackMock,
    error: errorCallbackMock,
    unrecognizedToken: unrecognizedTokenCallbackMock,
  };

  beforeEach(() => {
    tokenCallbackMock.mockRestore();
    errorCallbackMock.mockRestore();
    unrecognizedTokenCallbackMock.mockRestore();
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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 2, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'TypeB', 4, 2, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1003, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 1004, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaa',
      offset: 5,
      chunkOffset: 1000,
      stage: undefined,
    });
  });

  test('triggers unrecognizedToken in non-streaming mode', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleTree([ruleA]));

    const state: TokenizerState = {
      chunk: 'bbaac',
      offset: 2,
      chunkOffset: 1000,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1003, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();

    expect(unrecognizedTokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(unrecognizedTokenCallbackMock).toHaveBeenNthCalledWith(1, 1004, undefined);

    expect(state).toEqual({
      chunk: 'bbaac',
      offset: 4,
      chunkOffset: 1000,
      stage: undefined,
    });
  });

  test('does not fail if unrecognizedToken is missing in handler', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleTree([ruleA]));

    const state: TokenizerState = {
      chunk: 'b',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, {token: tokenCallbackMock}, undefined);
  });

  test('triggers error in streaming mode', () => {

    const ruleA: Rule = {type: 'TypeA', reader: text('aaa')};
    const ruleC: Rule = {type: 'TypeC', reader: text('cc')};
    const ruleError: Rule = {type: 'TypeError', reader: () => -777};

    const ruleIterator = compileRuleIterator(createRuleTree([ruleA, ruleC, ruleError]));

    const state: TokenizerState = {
      chunk: 'bbaaacceee',
      offset: 2,
      chunkOffset: 1000,
      stage: undefined,
    };

    ruleIterator(state, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 3, undefined);
    // Token read by ruleC is not emitted because no confirmation was given

    expect(errorCallbackMock).toHaveBeenCalledTimes(1);
    expect(errorCallbackMock).toHaveBeenNthCalledWith(1, 'TypeError', 1007, -777, undefined);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaacceee',
      offset: 5,
      chunkOffset: 1000,
      stage: undefined,
    });
  });

  test('does not fail if error is missing in handler', () => {

    const ruleError: Rule = {type: 'TypeError', reader: () => -777};

    const ruleIterator = compileRuleIterator(createRuleTree([ruleError]));

    const state: TokenizerState = {
      chunk: 'a',
      offset: 0,
      chunkOffset: 0,
      stage: undefined,
    };

    ruleIterator(state, {token: tokenCallbackMock}, undefined);
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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, context);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1, context);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1, context);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(ruleAToMock).toHaveBeenCalledTimes(2);
    expect(ruleAToMock).toHaveBeenNthCalledWith(1, 'ababbbb', 0, 1, context);
    expect(ruleAToMock).toHaveBeenNthCalledWith(2, 'ababbbb', 2, 1, context);

    expect(ruleBToMock).toHaveBeenCalledTimes(2);
    expect(ruleBToMock).toHaveBeenNthCalledWith(1, 'ababbbb', 1, 1, context);
    expect(ruleBToMock).toHaveBeenNthCalledWith(2, 'ababbbb', 3, 1, context);

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stage: 'B',
    });
  });

  test('optimizes rule prefixes', () => {

    const prefixReaderMock: ReaderFunction<any> = jest.fn((input, offset) => offset + 1);

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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeB', 0, 2, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

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

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 2, 1, undefined);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 4, 1, undefined);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 5,
      chunkOffset: 0,
      stage: undefined,
    });
  });
});
