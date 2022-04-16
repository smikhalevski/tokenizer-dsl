import {Binding, Code, Var} from './code-types';

/**
 * Returns the unique variable name.
 */
export type VarRenamer = (v: Var) => string;

/**
 * Creates the new variable placeholder.
 */
export function createVar(): Var {
  return Symbol();
}

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

/**
 * Compiles a function from the given code.
 *
 * ```ts
 * const myArg = Symbol();
 * const myVar = Symbol();
 * const myBoundVar = Symbol();
 *
 * const myFn = compileFunction(
 *     [myArg],
 *     [
 *       'var ', myVar, '= 123;',
 *       'return ', myVar, '+', myArg, '+', myBoundVar,
 *     ],
 *     [[myBoundVar, 456]],
 * );
 *
 * myFn(789); // → 1368
 * ```
 *
 * @param argVars The list of function arguments.
 * @param code The body code of the function.
 * @param bindings The list of variable-value pairs that are bound to the output function.
 * @returns The compiled function.
 */
export function compileFunction<F extends Function>(argVars: Var[], code: Code, bindings?: Binding[]): F {
  const varRenamer = createVarRenamer();

  if (!bindings || !bindings.length) {
    return Function.apply(undefined, argVars.map(varRenamer).concat(assembleJs(code, varRenamer))) as F;
  }

  const fnCode: Code[] = [];
  const arr: unknown[] = [];
  const arrVar = createVar();

  // Dedupe bound vars
  const varMap = new Map(bindings);

  // Dedupe bound values
  const valueMap = inverseMap(varMap);

  valueMap.forEach((valueVar, value) => {
    fnCode.push('var ', valueVar, '=', arrVar, '[', arr.push(value) - 1, '];');
  });

  fnCode.push('return function(');

  for (let i = 0; i < argVars.length; ++i) {
    if (i > 0) {
      fnCode.push(',');
    }
    fnCode.push(argVars[i]);
  }

  fnCode.push('){', code, '}');

  const fnSrc = assembleJs(fnCode, (v) => varRenamer(varMap.has(v) ? valueMap.get(varMap.get(v))! : v));

  return Function.call(undefined, varRenamer(arrVar), fnSrc)(arr);
}

/**
 * Creates callback that returns a unique name for a variable.
 */
export function createVarRenamer(): VarRenamer {
  const varMap = new Map<Var, string>();

  return (v) => varMap.get(v) || varMap.set(v, encodeLowerAlpha(varMap.size)).get(v)!;
}

/**
 * Encodes a non-negative integer as a string of lower ASCII alpha characters (a-z).
 *
 * ```ts
 * encodeLowerAlpha(0); // → 'a'
 * encodeLowerAlpha(100); // → 'cw'
 * ```
 *
 * @param value The number to encode.
 */
export function encodeLowerAlpha(value: number): string {
  let str = '';

  do {
    str = String.fromCharCode(97 /*a*/ + value % 26) + str;
    value /= 26;
  } while (--value >= 0);

  return str;
}

export function inverseMap<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(Array.from(map).map(([k, v]) => [v, k]));
}

export function toArray<T>(t: T | T[]): T[] {
  return Array.isArray(t) ? t : [t];
}
