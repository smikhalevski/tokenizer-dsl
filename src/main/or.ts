import {Code, createInternalTaker, createVar, toTaker, Var} from './js';
import {never} from './never';
import {none} from './none';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory, TakerLike} from './taker-types';
import {isInternalTaker, isTakerCodegen} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: TakerLike[]): Taker {

  takers = takers.reduce<TakerLike[]>((takers, taker) => {

    if (takers.length !== 0 && takers[takers.length - 1] === none) {
      return takers;
    }
    if (isInternalTaker<OrTaker>(taker, InternalTakerType.OR)) {
      takers.push(...taker.takers);
      return takers;
    }
    if (taker !== never) {
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
  return createOrTaker(takers);
}

export interface OrTaker extends InternalTaker {
  type: InternalTakerType.OR;
  takers: TakerLike[];
}

export function createOrTaker(takers: TakerLike[]): OrTaker {

  const takersLastIndex = takers.length - 1;

  const takerVars: Var[] = [];

  const values = takers.reduce<[Var, unknown][]>((values, taker) => {
    if (isTakerCodegen(taker)) {
      values.push(...taker.values);
    } else {
      const takerVar = createVar();
      takerVars.push(takerVar);
      values.push([takerVar, taker]);
    }
    return values;
  }, []);

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const code: Code[] = [];
    const tailCode: Code[] = [];

    for (let i = 0, j = 0; i <= takersLastIndex; ++i) {
      const taker = takers[i];

      code.push(isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, resultVar) : [resultVar, '=', takerVars[j++], '(', inputVar, ',', offsetVar, ');']);

      if (i !== takersLastIndex) {
        code.push('if(', resultVar, '===' + ResultCode.NO_MATCH + '){');
        tailCode.push('}');
      }
    }

    code.push(tailCode);
    return code;
  };

  const taker = createInternalTaker<OrTaker>(InternalTakerType.OR, factory, values);

  taker.takers = takers;

  return taker;
}
