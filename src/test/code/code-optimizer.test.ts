import {Code, createVar, varAssign} from '../../main/code';
import {countVarRefs, Direction, inlineVars, walkChildren} from '../../main/code/code-optimizer';

describe('walkChildren', () => {

  const v = createVar();

  test('walks children forwards', () => {
    const walkerMock = jest.fn();

    const code: Code = ['aaa', v, 'bbb'];

    walkChildren(code, 0, Direction.FORWARDS, walkerMock);

    expect(walkerMock).toHaveBeenCalledTimes(3);
    expect(walkerMock).toHaveBeenNthCalledWith(1, 'aaa', 0, code);
    expect(walkerMock).toHaveBeenNthCalledWith(2, v, 1, code);
    expect(walkerMock).toHaveBeenNthCalledWith(3, 'bbb', 2, code);
  });

  test('walks children forwards and traverses arrays', () => {
    const walkerMock = jest.fn();

    const code: Code = [['aaa'], [v], 'bbb'];

    walkChildren(code, 0, Direction.FORWARDS, walkerMock);

    expect(walkerMock).toHaveBeenCalledTimes(3);
    expect(walkerMock).toHaveBeenNthCalledWith(1, 'aaa', 0, code[0]);
    expect(walkerMock).toHaveBeenNthCalledWith(2, v, 0, code[1]);
    expect(walkerMock).toHaveBeenNthCalledWith(3, 'bbb', 2, code);
  });

  test('walks children backwards', () => {
    const walkerMock = jest.fn();

    const code: Code[] = ['aaa', v, 'bbb'];

    walkChildren(code, 2, Direction.BACKWARDS, walkerMock);

    expect(walkerMock).toHaveBeenCalledTimes(3);
    expect(walkerMock).toHaveBeenNthCalledWith(1, 'bbb', 2, code);
    expect(walkerMock).toHaveBeenNthCalledWith(2, v, 1, code);
    expect(walkerMock).toHaveBeenNthCalledWith(3, 'aaa', 0, code);
  });

  test('walks children backwards and traverses arrays', () => {
    const walkerMock = jest.fn();

    const code: Code[] = [['aaa'], [v, 'qqq'], 'bbb'];

    walkChildren(code, 2, Direction.BACKWARDS, walkerMock);

    expect(walkerMock).toHaveBeenCalledTimes(4);
    expect(walkerMock).toHaveBeenNthCalledWith(1, 'bbb', 2, code);
    expect(walkerMock).toHaveBeenNthCalledWith(2, 'qqq', 1, code[1]);
    expect(walkerMock).toHaveBeenNthCalledWith(3, v, 0, code[1]);
    expect(walkerMock).toHaveBeenNthCalledWith(4, 'aaa', 0, code[0]);
  });
});

describe('countVarRefs', () => {

  const v = createVar();

  test('returns 0 if var was not referenced', () => {
    expect(countVarRefs([], 0, v)).toBe(0);
    expect(countVarRefs([v], 0, createVar())).toBe(0);
  });

  test('returns 1 if var was referenced once', () => {
    expect(countVarRefs([v], 0, v)).toBe(1);
  });

  test('returns 2 if var was referenced more then once', () => {
    expect(countVarRefs([v, v, v], 0, v)).toBe(2);
    expect(countVarRefs([v, [[[v]]], v], 0, v)).toBe(2);
  });

  test('counts vars in nested blocks', () => {
    expect(countVarRefs([varAssign(createVar(), [[[v]]])], 0, v)).toBe(1);
    expect(countVarRefs([varAssign(createVar(), [[[v], v]])], 0, v)).toBe(2);
  });
});

describe('inlineVars', () => {

  const v = createVar();

  test('removes unused assignment', () => {
    const code: Code = ['aaa', varAssign(v, 123), 'bbb'];

    inlineVars(code);

    expect(code).toEqual(['aaa', '', 'bbb']);
  });

  test('removes unused assignment if it uses the assigned var', () => {
    const code: Code = ['aaa', varAssign(v, [createVar(), 'AAA']), 'bbb'];

    inlineVars(code);

    expect(code).toEqual(['aaa', '', 'bbb']);
  });

  test('inlines var assignment that uses assigned var', () => {
    const var1 = createVar();
    const var2 = createVar();

    const code: Code = ['aaa', varAssign(var1, [var2, 'AAA']), 'bbb', var1];

    inlineVars(code);

    expect(code).toEqual(['aaa', '', 'bbb', [var2, 'AAA']]);
  });

  test('inlines single var assignment', () => {
    const code: Code = ['aaa', varAssign(v, 'AAA'), 'bbb', v];

    inlineVars(code);

    expect(code).toEqual(['aaa', '', 'bbb', ['AAA']]);
  });

  test('inlines var assignment if var was already referenced', () => {
    const code: Code = [v, 'aaa', varAssign(v, 'AAA'), 'bbb', v];

    inlineVars(code);

    expect(code).toEqual([v, 'aaa', '', 'bbb', ['AAA']]);
  });

  test('inlines var assignment in scope of an enclosing array', () => {

    const code: Code = ['aaa', [varAssign(v, 'AAA'), 'bbb', v], 'ccc', v];

    inlineVars(code);

    expect(code).toEqual(['aaa', ['', 'bbb', ['AAA']], 'ccc', v]);
  });

  test('inlines var assignment into another assignment', () => {
    const var1 = createVar();
    const var2 = createVar();

    const code: Code = ['aaa', varAssign(var1, 'AAA'), varAssign(var2, ['BBB', var1, 'CCC']), var2, var2];

    inlineVars(code);

    expect(code).toEqual(['aaa', '', varAssign(var2, ['BBB', ['AAA'], 'CCC']), var2, var2]);
  });

  test('inlines sequential assignments', () => {
    const code: Code = [varAssign(v, 'AAA'), varAssign(v, [v, 'BBB']), v];

    inlineVars(code);

    expect(code).toEqual(['', '', [['AAA'], 'BBB']]);
  });

  test('preserves retained var assignment', () => {
    const code: Code = [varAssign(v, 'AAA', true), v];

    inlineVars(code);

    expect(code).toEqual([varAssign(v, 'AAA', true), v]);
  });

  test('preserves retained var assignment even if var is not referenced', () => {
    const code: Code = [varAssign(v, 'AAA', true)];

    inlineVars(code);

    expect(code).toEqual([varAssign(v, 'AAA', true)]);
  });

  test.skip('does not inline over retained assignment', () => {
    const code: Code = [varAssign(v, 'AAA'), varAssign(v, 'BBB', true), v];

    inlineVars(code);

    expect(code).toEqual([varAssign(v, 'BBB', true), v]);
  });
});
