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

  test('returns a predefined variable name', () => {
    const var1 = createVar();
    const var2 = createVar();

    const varRenamer = createVarRenamer([[var1, 'b'], [var2, 'c']]);

    expect(varRenamer(var1)).toBe('b');
    expect(varRenamer(var2)).toBe('c');
    expect(varRenamer(createVar())).toBe('a');
    expect(varRenamer(createVar())).toBe('d');
  });
});
