import {Binding, Code, createVar, Var} from '../code';
import {InternalTaker, Qqq, Taker} from './taker-types';
import {createQqq, createSymbol, createTakerCall} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Taker[]): Taker {
  return new SeqTaker(takers);
}

export const SEQ_TYPE = createSymbol();

export class SeqTaker implements InternalTaker {

  readonly type = SEQ_TYPE;

  constructor(public takers: Taker[]) {
  }

  factory(inputVar: Var, offsetVar: Var, resultVar: Var): Qqq {
    const {takers} = this;

    const takersLength = takers.length;
    const code: Code[] = [];
    const bindings: Binding[] = [];

    for (let i = 0; i < takersLength - 1; ++i) {
      const taker = takers[i];
      const takerResultVar = createVar();

      code.push(
          'var ', takerResultVar, ';',
          createTakerCall(taker, inputVar, offsetVar, takerResultVar, bindings),
          'if(', takerResultVar, '<0){', resultVar, '=', takerResultVar, '}else{'
      );

      offsetVar = takerResultVar;
    }

    code.push(
        createTakerCall(takers[takersLength - 1], inputVar, offsetVar, resultVar, bindings),
        '}'.repeat(takersLength - 1),
    );
    return createQqq(code, bindings);
  }
}
