import {Code, Var} from './code-types';

const reLf = /\n/g;

let reIdentifier: RegExp;

try {
  reIdentifier = /^[\p{Letter}_$][\p{Letter}\d_$]*$/u;
} catch {
  reIdentifier = /^[a-zA-Z_$][\w$]*$/;
}

const reArrayIndex = /^(?:0|[1-9]\d*)$/;

export function block(...code: Code[]): Code {
  return {type: 'block', code};
}

export function varAssign(v: Var, code: Code): Code {
  return {type: 'varAssign', var: v, code};
}

export function varDeclare(v: Var, code?: Code): Code {
  return {type: 'varDeclare', var: v, code};
}

export function prop(name: string | number): Code {
  return typeof name === 'string' && !reIdentifier.test(name) && !reArrayIndex.test(name) ? JSON.stringify(name) : name;
}

export function propAccess(code: Code, name: Var | string | number, optional?: boolean): Code {
  if (typeof name === 'string' && reIdentifier.test(name)) {
    return [code, optional ? '?.' : '.', name];
  }
  return [code, optional ? '?.[' : '[', typeof name === 'symbol' ? name : prop(name), ']'];
}

export function docComment(str: unknown): Code {
  return str != null ? '\n/**\n * ' + String(str).replace(reLf, '\n * ') + '\n */\n' : '';
}

export function comment(str: unknown): Code {
  return str != null ? '// ' + String(str).replace(reLf, '\n// ') + '\n' : '';
}
