import {all, ReaderFunction, Rule, seq, text} from '../../main';
import {compileRuleIterator, createRuleIteratorPlan, RuleIteratorState, TokenHandler} from '../../main/rules';

describe('compileRuleIterator', () => {

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

  test('emits tokens', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: all(text('a'))};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: all(text('b'))};

    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([
      ruleA,
      ruleB,
    ]));

    const state: RuleIteratorState = {
      chunk: 'abaabb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, 'TypeB', 4, 2);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'abaabb',
      offset: 6,
      chunkOffset: 0,
      stageIndex: -1,
    });
  });

  test('reads a non-empty token from the string at chunk start in streaming mode', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA]));

    const state: RuleIteratorState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, true, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 2,
      chunkOffset: 0,
      stageIndex: -1,
    });
  });

  test('reads a non-empty token from the string at chunk start in non-streaming mode', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA]));

    const state: RuleIteratorState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'aaa',
      offset: 3,
      chunkOffset: 0,
      stageIndex: -1,
    });
  });

  test('reads a non-empty token from the string with offset in streaming mode', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA]));

    const state: RuleIteratorState = {
      chunk: 'bbaaa',
      offset: 2,
      chunkOffset: 1000,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1003, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 1004, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaa',
      offset: 5,
      chunkOffset: 1000,
      stageIndex: -1,
    });
  });

  test('triggers unrecognizedToken in non-streaming mode', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA]));

    const state: RuleIteratorState = {
      chunk: 'bbaac',
      offset: 2,
      chunkOffset: 1000,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 1003, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();

    expect(unrecognizedTokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(unrecognizedTokenCallbackMock).toHaveBeenNthCalledWith(1, 1004);

    expect(state).toEqual({
      chunk: 'bbaac',
      offset: 4,
      chunkOffset: 1000,
      stageIndex: -1,
    });
  });

  test('triggers error in streaming mode', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('aaa')};
    const ruleC: Rule<any, any, any> = {type: 'TypeC', reader: text('cc')};
    const ruleError: Rule<any, any, any> = {type: 'TypeError', reader: () => -777};

    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA, ruleC, ruleError]));

    const state: RuleIteratorState = {
      chunk: 'bbaaacceee',
      offset: 2,
      chunkOffset: 1000,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 1002, 3);
    // Token read by ruleC is not emitted because no confirmation was given

    expect(errorCallbackMock).toHaveBeenCalledTimes(1);
    expect(errorCallbackMock).toHaveBeenNthCalledWith(1, 'TypeError', 1007, -777);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaacceee',
      offset: 5,
      chunkOffset: 1000,
      stageIndex: -1,
    });
  });

  test('respects literal stages', () => {
    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a'), on: ['A'], to: 'B'};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: text('b'), on: ['B'], to: 'A'};

    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA, ruleB]));

    const state: RuleIteratorState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: 0,
    };

    ruleIterator(state, true, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stageIndex: 1,
    });
  });

  test('respects computed stages', () => {
    const ruleAToMock = jest.fn(() => 'B');
    const ruleBToMock = jest.fn(() => 'A');

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a'), on: ['A'], to: ruleAToMock};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: text('b'), on: ['B'], to: ruleBToMock};

    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA, ruleB]));

    const state: RuleIteratorState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: 0,
    };

    const context = Symbol('context');

    ruleIterator(state, true, handler, context);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeB', 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 2, 1);

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
      stageIndex: 1,
    });
  });

  test('optimizes rule prefixes', () => {

    const prefixReaderMock: ReaderFunction<any> = jest.fn((input, offset) => offset + 1);

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: seq(prefixReaderMock, text('a'))};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: seq(prefixReaderMock, text('b'))};

    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA, ruleB]));

    const state: RuleIteratorState = {
      chunk: '_b',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeB', 0, 2);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: '_b',
      offset: 2,
      chunkOffset: 0,
      stageIndex: -1,
    });
  });

  test('does not emit tokens for silent rules', () => {

    const ruleA: Rule<any, any, any> = {type: 'TypeA', reader: text('a')};
    const ruleB: Rule<any, any, any> = {type: 'TypeB', reader: text('b'), silent: true};

    const ruleIterator = compileRuleIterator(createRuleIteratorPlan([ruleA, ruleB]));

    const state: RuleIteratorState = {
      chunk: 'ababa',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, 'TypeA', 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, 'TypeA', 2, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, 'TypeA', 4, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'ababa',
      offset: 5,
      chunkOffset: 0,
      stageIndex: -1,
    });
  });
});
