import {Code, CodeType} from './code-types';
import {isVar} from './code-utils';
import {createVarRenamer} from './createVarRenamer';

/**
 * Assembles code fragment into a compilable code string.
 *
 * @param code The code fragment to assemble.
 * @param varRenamer The callback that returns a variable name for a variable.
 * @returns The compilable string.
 */
export function assembleJs(code: Code, varRenamer = createVarRenamer()): string {
  if (isVar(code)) {
    return varRenamer(code);
  }

  if (!code || typeof code !== 'object') {
    return String(code);
  }

  if (Array.isArray(code)) {
    let src = '';
    for (let i = 0; i < code.length; ++i) {
      src += assembleJs(code[i], varRenamer);
    }
    return src;
  }

  const {valueCode} = code;

  if (code.type === CodeType.VAR_ASSIGN) {
    return varRenamer(code.var) + '=' + assembleJs(valueCode, varRenamer) + ';';
  }

  // varDeclare
  let src = 'var ' + varRenamer(code.var);

  if (valueCode.length) {
    const valueSrc = assembleJs(valueCode, varRenamer);

    if (valueSrc) {
      src += '=' + valueSrc;
    }
  }
  return src + ';';
}
