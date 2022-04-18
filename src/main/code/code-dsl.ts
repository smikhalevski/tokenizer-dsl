import {Code, CodeType, Var} from './code-types';
import {toArray} from './code-utils';

const reLf = /\n/g;

let reIdentifier: RegExp;

try {
  reIdentifier = /^[\p{Letter}_$][\p{Letter}\d_$]*$/u;
} catch {
  reIdentifier = /^[a-zA-Z_$][\w$]*$/;
}

const reArrayIndex = /^(?:0|[1-9]\d*)$/;

export function varAssign(v: Var, value: Code, retained = false): Code {
  return {type: CodeType.VAR_ASSIGN, var: v, children: toArray(value), retained};
}

export function varDeclare(v: Var, value: Code = [], retained = false): Code {
  return {type: CodeType.VAR_DECLARE, var: v, children: toArray(value), retained};
}

/**
 * Wraps given property key with quotes if needed so it can be used as a property name in an object declaration.
 *
 * ```ts
 * prop('foo bar'); // → '"foo bar"'
 *
 * prop('fooBar'); // → 'fooBar'
 *
 * prop('0'); // → '0'
 *
 * prop('0123'); // → '"0123"'
 * ```
 */
export function prop(name: string | number): Code {
  return typeof name === 'string' && !reIdentifier.test(name) && !reArrayIndex.test(name) ? JSON.stringify(name) : name;
}

/**
 * Returns a getter of the property.
 *
 * ```ts
 * propAccess('{}', 'foo'); // → {}.foo
 *
 * propAccess('{}', 'foo bar', true); // → {}?.["foo bar"]
 * ```
 *
 * @param code The value from which the property is read.
 * @param name The key of the property.
 * @param optional If `true` then optional chaining syntax is used.
 */
export function propAccess(code: Code, name: Var | string | number, optional?: boolean): Code {
  if (typeof name === 'string' && reIdentifier.test(name)) {
    return [code, optional ? '?.' : '.', name];
  }
  return [code, optional ? '?.[' : '[', typeof name === 'symbol' ? name : prop(name), ']'];
}

export function docComment(str: unknown): Code {
  return str == null || str === '' ? '' : '\n/**\n * ' + String(str).replace(reLf, '\n * ') + '\n */\n';
}

export function comment(str: unknown): Code {
  return str == null || str === '' ? '' : '// ' + String(str).replace(reLf, '\n// ') + '\n';
}
