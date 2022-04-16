import {assembleJs, Code, createVar, createVarRenamer} from '../../main/code';
import {comment, prop, propAccess, varAssign, varDeclare} from '../../main/code/code-dsl';

describe('Code DSL', () => {

  test('end-to-end', () => {

    const v = createVar();

    const c: Code = [
      comment('asd'),
      'if(123===', v, '){',
      varDeclare(v),
      varAssign(v, propAccess(['{', prop('a b'), ':123', '}'], v)),
      '}',
    ];

    expect(assembleJs(c, createVarRenamer())).toBe('// asd\nif(123===a){var a;a={"a b":123}[a];}');
  });
});
