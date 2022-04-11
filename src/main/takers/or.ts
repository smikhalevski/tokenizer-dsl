import {Binding, Code, Var} from '../code';
import {never} from './never';
import {none} from './none';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, createTakerCallCode} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or<C = any>(...takers: Taker<C>[]): Taker<C> {

  const children: Taker<C>[] = [];

  for (const taker of takers) {
    if (taker === none) {
      break;
    }
    if (taker instanceof OrTaker) {
      children.push(...taker.takers);
      continue;
    }
    if (taker !== never) {
      children.push(taker);
    }
  }
  if (children.length === 0) {
    return none;
  }
  if (children.length === 1) {
    return children[0];
  }

  return new OrTaker(children);
}

export class OrTaker<C> implements TakerCodegen {

  constructor(public takers: Taker<C>[]) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {takers} = this;

    const takersLength = takers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < takersLength; ++i) {
      const taker = takers[i];

      code.push(createTakerCallCode(taker, inputVar, offsetVar, contextVar, resultVar, bindings));
      if (i < takersLength - 1) {
        code.push('if(', resultVar, '===', NO_MATCH, '){');
      }
    }
    code.push('}'.repeat(takersLength - 1));

    return createCodeBindings(code, bindings);
  }
}
