import {all, createRule, text} from '../../main';
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
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleB, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 4);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(4, ruleB, 4, 6);

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
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 2);

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
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 3);

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
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 1002, 1003);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1003, 1004);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 1004, 1005);

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
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 1002, 1003);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleA, 1003, 1004);

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
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 1002, 1005);
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

  test('respects stages', () => {
    const ruleA = createRule(text('a'), ['A'], 'B');
    const ruleB = createRule(text('b'), ['B'], 'A');

    const ruleIterator = compileRuleIterator([ruleA, ruleB]);

    const state: RuleIteratorState = {
      chunk: 'ababbbb',
      offset: 0,
      chunkOffset: 0,
      stageIndex: ruleIterator.stages.indexOf('A'),
    };

    ruleIterator(state, true, handler, undefined);

    expect(tokenCallbackMock).toHaveBeenCalledTimes(3);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(1, ruleA, 0, 1);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(2, ruleB, 1, 2);
    expect(tokenCallbackMock).toHaveBeenNthCalledWith(3, ruleA, 2, 3);

    expect(errorCallbackMock).not.toHaveBeenCalled();
    expect(unrecognizedTokenCallbackMock).not.toHaveBeenCalled();

    expect(state).toEqual({
      chunk: 'ababbbb',
      offset: 3,
      chunkOffset: 0,
      stageIndex: 1,
    });
  });
});
