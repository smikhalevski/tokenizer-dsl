import {assembleJs, createVar, createVarRenamer} from '../../main/code';
import {varAssign, varDeclare} from '../../main/code/code-dsl';

describe('assembleJs', () => {

  test('assembles primitives', () => {
    expect(assembleJs(true, createVarRenamer())).toBe('true');
    expect(assembleJs(false, createVarRenamer())).toBe('false');
    expect(assembleJs(123, createVarRenamer())).toBe('123');
    expect(assembleJs('abc', createVarRenamer())).toBe('abc');
  });

  test('assembles variables', () => {
    const aVar = createVar();
    const bVar = createVar();

    expect(assembleJs([aVar, '=', bVar, '+', aVar], createVarRenamer())).toBe('a=b+a');
  });

  test('assembles var declaration', () => {
    expect(assembleJs(varDeclare(createVar()), createVarRenamer())).toBe('var a;');
    expect(assembleJs(varDeclare(createVar(), undefined), createVarRenamer())).toBe('var a;');
  });

  test('assembles var declaration with initial value', () => {
    expect(assembleJs(varDeclare(createVar(), '123'), createVarRenamer())).toBe('var a=123;');
  });

  test('assembles var assignment', () => {
    expect(assembleJs(varAssign(createVar(), '123'), createVarRenamer())).toBe('a=123;');
    expect(assembleJs(varAssign(createVar(), undefined), createVarRenamer())).toBe('a=undefined;');
  });
});
