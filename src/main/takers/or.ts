import {Binding, Code, Var} from '../code';
import {CodeBindings, NO_MATCH, Taker, TakerCodegen} from './taker-types';
import {createCodeBindings, createTakerCallCode} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Taker[]): Taker {
  return new OrTaker(takers);
}

export class OrTaker implements TakerCodegen {

  constructor(public takers: Taker[]) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): CodeBindings {
    const {takers} = this;

    const takersLength = takers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < takersLength; ++i) {
      const taker = takers[i];

      code.push(createTakerCallCode(taker, inputVar, offsetVar, resultVar, bindings));
      if (i < takersLength - 1) {
        code.push('if(', resultVar, '===', NO_MATCH, '){');
      }
    }
    code.push('}'.repeat(takersLength - 1));

    return createCodeBindings(code, bindings);
  }
}
