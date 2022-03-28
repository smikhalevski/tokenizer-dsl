import {InternalTaker, Taker, TakerCodeFactory, TakerLike} from './taker-types';

/**
 * The placeholder that denotes a variable reference in a code fragment.
 */
export type Var = symbol;

/**
 * The code fragment.
 */
export type Code = Code[] | Var | string | number | boolean;

/**
 * The value that would be bound to the given variable inside a compiled function.
 *
 * @see {@link compileFunction}
 */
export type Binding = [Var, unknown];

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
 * @param vars The mutable list of variables used in the code fragment. This list is populated with variables that were
 * met during the code assembly.
 * @returns The compilable string.
 */
export function assembleCode(code: Code, vars: Var[] = []): string {
  if (typeof code === 'symbol') {
    const varIndex = vars.indexOf(code);

    return 'v' + (varIndex === -1 ? vars.push(code) - 1 : varIndex);
  }
  if (Array.isArray(code)) {
    let str = '';
    for (const childCode of code) {
      str += assembleCode(childCode, vars);
    }
    return str;
  }
  return String(code);
}

/**
 * Compiles a function from the given code.
 *
 * @param argVars The list of function arguments.
 * @param code The body code of the function.
 * @param bindings The list of variable-value pairs that are bound to the output function.
 * @returns The compiled function.
 */
export function compileFunction<F extends Function>(argVars: Var[], code: Code, bindings?: Binding[]): F {

  if (!bindings || bindings.length === 0) {
    const args = argVars.map((argVar, i) => 'v' + i);
    args.push(assembleCode(code, argVars.slice(0)));
    return Function.apply(undefined, args) as F;
  }

  const boundValuesVar = createVar();
  const boundCode: Code[] = [];
  const boundValues: unknown[] = [];

  for (let i = 0; i < bindings.length; ++i) {
    boundCode.push('var ', bindings[i][0], '=', boundValuesVar, '[', i, '];');
    boundValues.push(bindings[i][1]);
  }

  boundCode.push('return function(');

  for (let i = 0; i < argVars.length; ++i) {
    if (i > 0) {
      boundCode.push(',');
    }
    boundCode.push(argVars[i]);
  }

  boundCode.push('){', code, '}');

  const boundVars = [boundValuesVar];
  boundVars.push(...argVars);
  return Function.call(undefined, 'v0', assembleCode(boundCode, boundVars))(boundValues);
}

/**
 * Compiles an internal taker function of the given type.
 *
 * @param type The type of the taker.
 * @param factory The factory that returns the taker body code.
 * @param bindings The optional variable bindings available inside the taker function.
 * @returns The taker function.
 */
export function compileInternalTaker<T extends InternalTaker>(type: T['type'], factory: TakerCodeFactory, bindings?: Binding[]): T {
  const taker = toTaker({factory, bindings}) as T;

  taker.type = type;
  taker.factory = factory;
  taker.bindings = bindings;

  return taker;
}

export function toTaker(taker: TakerLike): Taker {
  if (typeof taker === 'function') {
    return taker;
  }

  const {factory, bindings} = taker;

  const inputVar = createVar();
  const offsetVar = createVar();
  const resultVar = createVar();

  const code: Code = [
    'var ', resultVar, ';',
    factory(inputVar, offsetVar, resultVar),
    'return ', resultVar,
  ];

  return compileFunction([inputVar, offsetVar, resultVar], code, bindings);
}
