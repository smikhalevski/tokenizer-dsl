import {createVar, createVarRenamer} from '../../main/code';

describe('createVarRenamer', () => {

  test('returns unique name', () => {
    const varRenamer = createVarRenamer();
    const var1 = createVar();
    const var2 = createVar();

    expect(varRenamer(var1)).toBe('a');
    expect(varRenamer(var2)).toBe('b');
    expect(varRenamer(var1)).toBe('a');
    expect(varRenamer(var2)).toBe('b');
  });
});
