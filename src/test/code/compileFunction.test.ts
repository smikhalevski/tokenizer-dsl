import {compileFunction, createVar} from '../../main/code';

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

  test('compiles a function with repeated bound vars', () => {
    const boundVar = createVar();

    expect(compileFunction([], ['return ', boundVar], [[boundVar, 111], [boundVar, 222]])()).toBe(222);
  });

  test('compiles a function with repeated bound values', () => {
    const bound1Var = createVar();
    const bound2Var = createVar();

    expect(compileFunction([], ['return ', bound1Var, '===', bound2Var], [[bound1Var, 111], [bound2Var, 111]])()).toBe(true);
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

  test('docs', () => {

    const myArg = createVar();
    const myVar = createVar();
    const myBoundVar = createVar();

    const myFn = compileFunction(
        [myArg],
        ['var ', myVar, '= 123;', 'return ', myVar, '+', myArg, '+', myBoundVar,],
        [[myBoundVar, 456]],
    );

    expect(myFn(789)).toBe((1368));
  });
});
