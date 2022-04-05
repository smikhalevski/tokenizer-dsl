import {assembleCode, compileFunction, createVar, Var} from '../../main/code';

describe('assembleCode', () => {

  test('assembles primitives', () => {
    const vars: Var[] = [];

    expect(assembleCode(true, vars)).toBe('true');
    expect(assembleCode(false, vars)).toBe('false');
    expect(assembleCode(123, vars)).toBe('123');
    expect(assembleCode('abc', vars)).toBe('abc');
    expect(vars.length).toBe(0);
  });

  test('assembles variables', () => {
    const aVar = createVar();
    const bVar = createVar();

    expect(assembleCode([aVar, '=', bVar])).toBe('v0=v1');
  });

  test('uses vars to derive var name', () => {
    const aVar = createVar();
    const bVar = createVar();

    expect(assembleCode([aVar, '=', bVar], [createVar(), createVar(), aVar, bVar])).toBe('v2=v3');
  });
});

describe('compileFunction', () => {

  test('compiles a function without arguments', () => {
    expect(compileFunction([], 'return "ok"')()).toBe('ok');
  });

  test('compiles a function with one argument', () => {
    const argVar = createVar();

    expect(compileFunction([argVar], ['return ', argVar, '+1'])(2)).toBe(3);
  });

  test('compiles a function with multiple arguments', () => {
    const arg1Var = createVar();
    const arg2Var = createVar();
    const arg3Var = createVar();

    expect(compileFunction([arg1Var, arg2Var, arg3Var], ['return ', arg1Var, '+', arg2Var, '+', arg3Var])(1, 2, 3)).toBe(6);
  });

  test('compiles a function with the single bound value', () => {
    const boundVar = createVar();

    expect(compileFunction([], ['return ', boundVar, '()'], [[boundVar, () => 'ok']])()).toBe('ok');
  });

  test('compiles a function with multiple bound values', () => {
    const bound1Var = createVar();
    const bound2Var = createVar();

    expect(compileFunction([], ['return ', bound1Var, '()+', bound2Var, '()'], [[bound1Var, () => 3], [bound2Var, () => 7]])()).toBe(10);
  });

  test('compiles a function with arguments and bound values', () => {
    const arg1Var = createVar();
    const arg2Var = createVar();
    const bound1Var = createVar();
    const bound2Var = createVar();

    expect(compileFunction(
        [arg1Var, arg2Var],
        ['return ', bound1Var, '(', arg1Var, ')+', bound2Var, '(', arg2Var, ')'],
        [
          [bound1Var, (value: number) => value * 3],
          [bound2Var, (value: number) => value * 7],
        ])(5, 2)
    ).toBe(29);
  });
});
