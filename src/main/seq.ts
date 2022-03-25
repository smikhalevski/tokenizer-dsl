import {Code, createInternalTaker, createVar, toTaker, Var} from './js';
import {never} from './never';
import {none} from './none';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory, TakerLike} from './taker-types';
import {isInternalTaker, isTakerCodegen} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: TakerLike[]): Taker {
  if (takers.includes(never)) {
    return never;
  }

  takers = takers.reduce<TakerLike[]>((takers, taker) => {
    if (isInternalTaker<SeqTaker>(taker, InternalTakerType.SEQ)) {
      takers.push(...taker.takers);
      return takers;
    }
    if (taker !== none) {
      takers.push(taker);
    }
    return takers;
  }, []);

  const takersLength = takers.length;

  if (takersLength === 0) {
    return none;
  }
  if (takersLength === 1) {
    return toTaker(takers[0]);
  }
  return createSeqTaker(takers);
}

export interface SeqTaker extends InternalTaker {
  type: InternalTakerType.SEQ;
  takers: TakerLike[];
}

export function createSeqTaker(takers: TakerLike[]): SeqTaker {

  const takersLastIndex = takers.length - 1;

  const takerVars: Var[] = [];

  const values = takers.reduce<[Var, unknown][]>((values, taker, i) => {
    if (isTakerCodegen(taker)) {
      values.push(...taker.values);
    } else {
      const takerVar = takerVars[i] = createVar();
      values.push([takerVar, taker]);
    }
    return values;
  }, []);

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const code: Code[] = [];
    const tailCode: Code[] = [];

    for (let i = 0; i < takersLastIndex; ++i) {

      const taker = takers[i];
      const takerResultVar = createVar();

      code.push(
          'var ', takerResultVar, ';',
          isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, takerResultVar) : [takerResultVar, '=', takerVars[i], '(', inputVar, ',', offsetVar, ');'],
          'if(', takerResultVar, '<0){', resultVar, '=', takerResultVar, '}else{'
      );
      tailCode.push('}');

      offsetVar = takerResultVar;
    }

    const lastTaker = takers[takersLastIndex];

    code.push(
        isTakerCodegen(lastTaker) ? lastTaker.factory(inputVar, offsetVar, resultVar) : [resultVar, '=', takerVars[takersLastIndex], '(', inputVar, ',', offsetVar, ');'],
        tailCode,
    );

    return code;
  };

  const taker = createInternalTaker<SeqTaker>(InternalTakerType.SEQ, factory, values);

  taker.takers = takers;

  return taker;
}
