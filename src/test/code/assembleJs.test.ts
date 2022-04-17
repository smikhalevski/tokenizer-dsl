import {assembleJs, createVar, createVarRenamer} from '../../main/code';

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
});
