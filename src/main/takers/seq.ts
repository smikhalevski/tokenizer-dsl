import {Binding, Code, createVar, Var} from '../code';
import {never} from './never';
import {none} from './none';
import {CodeBindings, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, createTakerCallCode} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Taker[]): Taker {

  const children: Taker[] = [];

  for (const taker of takers) {
    if (taker instanceof SeqTaker) {
      children.push(...taker.takers);
      continue;
    }
    if (taker !== none) {
      children.push(taker);
    }
  }
  if (children.includes(never)) {
    return never;
  }
  if (children.length === 0) {
    return none;
  }
  if (children.length === 1) {
    return children[0];
  }

  return new SeqTaker(children);
}

export class SeqTaker implements TakerCodegen {

  constructor(public takers: Taker[]) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {takers} = this;

    const takersLength = takers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < takersLength - 1; ++i) {
      const taker = takers[i];
      const takerResultVar = createVar();

      code.push(
          'var ', takerResultVar, ';',
          createTakerCallCode(taker, inputVar, offsetVar, takerResultVar, bindings),
          'if(', takerResultVar, '<0){', resultVar, '=', takerResultVar, '}else{'
      );

      offsetVar = takerResultVar;
    }

    code.push(
        createTakerCallCode(takers[takersLength - 1], inputVar, offsetVar, resultVar, bindings),
        '}'.repeat(takersLength - 1),
    );
    return createCodeBindings(code, bindings);
  }
}
