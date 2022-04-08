import {Code, createVar, Var} from '../code';
import {InternalTaker, SEQ_TYPE} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {Taker} from './taker-types';
import {isInternalTaker, isTakerCodegen, toTakerFunction} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Taker[]): Taker {

  if (takers.includes(never)) {
    return never;
  }

  const flatTakers: Taker[] = [];

  for (const taker of takers) {
    if (isInternalTaker<SeqTaker>(SEQ_TYPE, taker)) {
      flatTakers.push(...taker.takers);
      continue;
    }
    if (taker !== none) {
      flatTakers.push(taker);
    }
  }

  const takersLength = flatTakers.length;

  if (takersLength === 0) {
    return none;
  }
  if (takersLength === 1) {
    return toTakerFunction(flatTakers[0]);
  }
  return createSeqTaker(flatTakers);
}

export interface SeqTaker extends InternalTaker {
  type: SEQ_TYPE;
  takers: Taker[];
}

export function createSeqTaker(takers: Taker[]): SeqTaker {

  const takersLength = takers.length;
  const bindings: [Var, unknown][] = [];

  for (const taker of takers) {
    if (isTakerCodegen(taker)) {
      if (taker.bindings) {
        bindings.push(...taker.bindings);
      }
    } else {
      bindings.push([createVar(), taker]);
    }
  }

  return {
    type: SEQ_TYPE,
    bindings,
    takers,

    factory(inputVar, offsetVar, resultVar) {

      const code: Code[] = [];

      let j = 0;

      for (let i = 0; i < takersLength - 1; ++i) {
        const taker = takers[i];
        const takerResultVar = createVar();

        code.push(
            'var ', takerResultVar, ';',
            isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, takerResultVar) : [takerResultVar, '=', bindings[j++][0], '(', inputVar, ',', offsetVar, ');'],
            'if(', takerResultVar, '<0){', resultVar, '=', takerResultVar, '}else{'
        );

        offsetVar = takerResultVar;
      }

      const lastTaker = takers[takersLength - 1];

      code.push(
          isTakerCodegen(lastTaker) ? lastTaker.factory(inputVar, offsetVar, resultVar) : [resultVar, '=', bindings[j][0], '(', inputVar, ',', offsetVar, ');'],
          '}'.repeat(takersLength - 1),
      );
      return code;
    },
  };
}
