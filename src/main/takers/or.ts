import {Binding, Code, Var} from '../code';
import {InternalTaker, NO_MATCH, Qqq, Taker} from './taker-types';
import {createQqq, createSymbol, createTakerCall} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Taker[]): Taker {
  return new OrTaker(takers);
}

export const OR_TYPE = createSymbol();

export class OrTaker implements InternalTaker {

  readonly type = OR_TYPE;

  constructor(public takers: Taker[]) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): Qqq {
    const {takers} = this;

    const takersLength = takers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < takersLength; ++i) {
      const taker = takers[i];

      code.push(createTakerCall(taker, inputVar, offsetVar, resultVar, bindings));
      if (i < takersLength - 1) {
        code.push('if(', resultVar, '===', NO_MATCH, '){');
      }
    }
    code.push('}'.repeat(takersLength - 1));

    return createQqq(code, bindings);
  }
}
