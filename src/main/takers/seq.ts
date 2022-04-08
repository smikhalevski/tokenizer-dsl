import {Code, createVar, Var} from '../code';
import {InternalTaker, SEQ_TYPE} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker, isInternalTaker, isTakerCodegen, toTakerFunction} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Taker[]): Taker {
  if (takers.includes(never)) {
    return never;
  }

  const t: Taker[] = [];

  for (const taker of takers) {
    if (isInternalTaker<SeqTaker>(SEQ_TYPE, taker)) {
      t.push(...taker.takers);
      continue;
    }
    if (taker !== none) {
      t.push(taker);
    }
  }

  const takersLength = t.length;

  if (takersLength === 0) {
    return none;
  }
  if (takersLength === 1) {
    return toTakerFunction(t[0]);
  }
  return createSeqTaker(t);
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

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const code: Code[] = [];
    const tailCode: Code[] = [];

    let j = 0;

    for (let i = 0; i < takersLength - 1; ++i) {
      const taker = takers[i];
      const takerResultVar = createVar();

      code.push(
          'var ', takerResultVar, ';',
          isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, takerResultVar) : [takerResultVar, '=', bindings[j++][0], '(', inputVar, ',', offsetVar, ');'],
          'if(', takerResultVar, '<0){', resultVar, '=', takerResultVar, '}else{'
      );
      tailCode.push('}');

      offsetVar = takerResultVar;
    }

    const lastTaker = takers[takersLength - 1];

    code.push(
        isTakerCodegen(lastTaker) ? lastTaker.factory(inputVar, offsetVar, resultVar) : [resultVar, '=', bindings[j][0], '(', inputVar, ',', offsetVar, ');'],
        tailCode,
    );
    return code;
  };

  const taker = createInternalTaker<SeqTaker>(SEQ_TYPE, factory, bindings);

  taker.takers = takers;

  return taker;
}
