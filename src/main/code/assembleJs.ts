import {Code, VarRenamer} from './code-types';

/**
 * Assembles code fragment into a compilable code string.
 *
 * @param code The code fragment to assemble.
 * @param varRenamer The callback that returns a variable name for a variable.
 * @returns The compilable string.
 */
export function assembleJs(code: Code, varRenamer: VarRenamer): string {
  if (typeof code === 'symbol') {
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

  if (code.type === 'varAssign') {
    return varRenamer(code.var) + '=' + assembleJs(code.value, varRenamer) + ';';
  }

  // varDeclare
  let src = 'var ' + varRenamer(code.var);

  if (code.value.length) {
    const valueSrc = assembleJs(code.value, varRenamer);

    if (valueSrc) {
      src += '=' + valueSrc;
    }
  }
  return src + ';';
}
