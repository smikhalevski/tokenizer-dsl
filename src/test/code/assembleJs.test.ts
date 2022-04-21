import {assembleJs, createVar, varAssign, varDeclare} from '../../main/code';

describe('assembleJs', () => {

  test('assembles primitives', () => {
    expect(assembleJs(true)).toBe('true');
    expect(assembleJs(false)).toBe('false');
    expect(assembleJs(123)).toBe('123');
    expect(assembleJs('abc')).toBe('abc');
  });

  test('assembles variables', () => {
    const aVar = createVar();
    const bVar = createVar();

    expect(assembleJs([aVar, '=', bVar, '+', aVar])).toBe('a=b+a');
  });

  test('assembles var declaration', () => {
    expect(assembleJs(varDeclare(createVar()))).toBe('var a;');
    expect(assembleJs(varDeclare(createVar(), undefined))).toBe('var a;');
  });

  test('assembles var declaration with initial value', () => {
    expect(assembleJs(varDeclare(createVar(), '123'))).toBe('var a=123;');
  });

  test('assembles var assignment', () => {
    expect(assembleJs(varAssign(createVar(), '123'))).toBe('a=123;');
    expect(assembleJs(varAssign(createVar(), undefined))).toBe('a=undefined;');
  });
});
