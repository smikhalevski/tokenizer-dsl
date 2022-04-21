import {Code, CodeType} from './code-types';
import {createVarRenamer} from './createVarRenamer';

/**
 * Assembles code fragment into a compilable code string.
 *
 * @param code The code fragment to assemble.
 * @param varRenamer The callback that returns a variable name for a variable.
 * @returns The compilable string.
 */
export function assembleJs(code: Code, varRenamer = createVarRenamer()): string {
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

  const {children} = code;

  if (code.type === CodeType.VAR_ASSIGN) {
    return varRenamer(code.var) + '=' + assembleJs(children, varRenamer) + ';';
  }

  // Var declaration
  let src = 'var ' + varRenamer(code.var);

  if (children.length) {
    const valueSrc = assembleJs(children, varRenamer);

    if (valueSrc) {
      src += '=' + valueSrc;
    }
  }
  return src + ';';
}
