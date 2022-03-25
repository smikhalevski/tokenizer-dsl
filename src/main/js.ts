import {TakerCodegen, TakerCodeFactory, InternalTaker, TakerLike, Taker} from './taker-types';

export type Var = symbol;

export type Code = Code[] | Var | string | number | boolean;

export function createVar(): Var {
  return Symbol();
}

export function compileCode(child: Code, vars: Var[] = []): string {
  if (typeof child === 'symbol') {
    const varIndex = vars.indexOf(child);

    return 'v' + (varIndex === -1 ? vars.push(child) - 1 : varIndex);
  }
  if (Array.isArray(child)) {
    return child.map((c) => compileCode(c, vars)).join('');
  }
  return String(child);
}

export function createInternalTaker<T extends InternalTaker & TakerCodegen>(type: T['type'], factory: TakerCodeFactory, values: [Var, unknown][] = []): T {

  const taker = toTaker({factory, values}) as T;

  taker.type = type;
  taker.factory = factory;
  taker.values = values;

  return taker;
}

export function toTaker(ttt: TakerLike): Taker {
  if (typeof ttt === 'function') {
    return ttt;
  }

  const {factory, values} = ttt;

  const valuesVar = createVar();
  const code: Code[] = [];

  for (let i = 0; i < values.length; ++i) {
    code.push('var ', values[i][0], '=', valuesVar, '[', i, '];');
  }

  const inputVar = createVar();
  const offsetVar = createVar();
  const returnVar = createVar();

  code.push(
      'return function(', inputVar, ',', offsetVar, '){',
      'var ', returnVar, ';',
      factory(inputVar, offsetVar, returnVar),
      'return ', returnVar,
      '}',
  );

  const vars: Var[] = [];
  const src = compileCode(code, vars);

  return values.length === 0 ? Function(src)() : Function('v' + (vars.indexOf(valuesVar)), src)(values.map(([, value]) => value));
}
