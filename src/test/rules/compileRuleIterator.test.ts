import {all, createRule, seq, TakerFunction, text} from '../../main';
import {compileRuleIterator, RuleHandler, RuleIteratorState} from '../../main/rules';

describe('compileRuleIterator', () => {

  let tokenCallbackMock = jest.fn();
  let errorCallbackMock = jest.fn();
  let unrecognizedTokenCallbackMock = jest.fn();

  const handler: RuleHandler<never, void> = {
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

    const ruleA = createRule(all(text('a')));
    const ruleB = createRule(all(text('b')));

    const ruleIterator = compileRuleIterator([
      ruleA,
      ruleB,
    ]);

    const state: RuleIteratorState = {
      chunk: 'abaabb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleB, 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, ruleB, 4, 2);

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
    const ruleA = createRule(text('a'));
    const ruleIterator = compileRuleIterator([ruleA]);

    const state: RuleIteratorState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, true, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 1);

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
    const ruleA = createRule(text('a'));
    const ruleIterator = compileRuleIterator([ruleA]);

    const state: RuleIteratorState = {
      chunk: 'aaa',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 1);

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
    const ruleA = createRule(text('a'));
    const ruleIterator = compileRuleIterator([ruleA]);

    const state: RuleIteratorState = {
      chunk: 'bbaaa',
      offset: 2,
      chunkOffset: 1000,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 1002, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1003, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 1004, 1);

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
    const ruleA = createRule(text('a'));
    const ruleIterator = compileRuleIterator([ruleA]);

    const state: RuleIteratorState = {
      chunk: 'bbaac',
      offset: 2,
      chunkOffset: 1000,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 1002, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1003, 1);

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
    const ruleA = createRule(text('aaa'));
    const ruleC = createRule(text('cc'));
    const ruleError = createRule(() => -777);
    const ruleIterator = compileRuleIterator([ruleA, ruleC, ruleError]);

    const state: RuleIteratorState = {
      chunk: 'bbaaacceee',
      offset: 2,
      chunkOffset: 1000,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 1002, 3);
    // Token taken by ruleB is not emitted because no confirmation was given

    expect(errorCallbackMock).toHaveBeenCalledTimes(1);
    expect(errorCallbackMock).toHaveBeenNthCalledWith(1, ruleError, 1007, -777);

    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'bbaaacceee',
      offset: 5,
      chunkOffset: 1000,
      stageIndex: -1,
    });
  });

  test('respects literal stages', () => {
    const ruleA = createRule(text('a'), ['A'], 'B');
    const ruleB = createRule(text('b'), ['B'], 'A');

    const ruleIterator = compileRuleIterator([ruleA, ruleB]);

    const state: RuleIteratorState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: 0,
    };

    ruleIterator(state, true, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleB, 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 1);

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
    const ruleANextStageMock = jest.fn(() => 'B');
    const ruleBNextStageMock = jest.fn(() => 'A');

    const ruleA = createRule(text('a'), ['A'], ruleANextStageMock);
    const ruleB = createRule(text('b'), ['B'], ruleBNextStageMock);

    const ruleIterator = compileRuleIterator([ruleA, ruleB]);

    const state: RuleIteratorState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: 0,
    };

    const context = Symbol('context');

    ruleIterator(state, true, handler, context);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleB, 1, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 1);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(ruleANextStageMock).toHaveBeenCalledTimes(2);
    expect(ruleANextStageMock).toHaveBeenNthCalledWith(1, 'ababbbb', 0, 1, context);
    expect(ruleANextStageMock).toHaveBeenNthCalledWith(2, 'ababbbb', 2, 1, context);

    expect(ruleBNextStageMock).toHaveBeenCalledTimes(2);
    expect(ruleBNextStageMock).toHaveBeenNthCalledWith(1, 'ababbbb', 1, 1, context);
    expect(ruleBNextStageMock).toHaveBeenNthCalledWith(2, 'ababbbb', 3, 1, context);

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stageIndex: 1,
    });
  });

  test('optimizes rule prefixes', () => {

    const prefixTakerMock: TakerFunction<any> = jest.fn((input, offset) => offset + 1);

    const ruleA = createRule(seq(prefixTakerMock, text('a')));
    const ruleB = createRule(seq(prefixTakerMock, text('b')));

    const ruleIterator = compileRuleIterator([ruleA, ruleB]);

    const state: RuleIteratorState = {
      chunk: '_b',
      offset: 0,
      chunkOffset: 0,
      stageIndex: -1,
    };

    ruleIterator(state, false, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleB, 0, 2);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: '_b',
      offset: 2,
      chunkOffset: 0,
      stageIndex: -1,
    });
  });
});
