import {assembleJs} from './assembleJs';
import {Binding, Code, Var} from './code-types';
import {createVar, inverseMap} from './code-utils';
import {createVarRenamer} from './createVarRenamer';

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
export function compileFunction<F extends Function>(argVars: Var[], code: Code, bindings?: Binding[] | Iterable<Binding>): F {
  const varRenamer = createVarRenamer();

  // Dedupe bound vars
  const varMap = new Map(bindings);

  if (!varMap.size) {
    return Function.apply(undefined, argVars.map(varRenamer).concat(assembleJs(code, varRenamer))) as F;
  }

  const fnCode: Code[] = [];
  const arr: unknown[] = [];
  const arrVar = createVar();

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
