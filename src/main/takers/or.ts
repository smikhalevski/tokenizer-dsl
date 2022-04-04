import {Code, Var} from '../code-types';
import {createVar} from '../code-utils';
import {never} from './never';
import {none} from './none';
import {InternalTaker, InternalTakerType, ResultCode, Taker, TakerCodeFactory, TakerLike} from './taker-types';
import {compileInternalTaker, isInternalTaker, isTakerCodegen, toTaker} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: TakerLike[]): Taker {

  const t: TakerLike[] = [];

  for (const taker of takers) {
    if (taker === none) {
      break;
    }
    if (isInternalTaker<OrTaker>(taker, InternalTakerType.OR)) {
      t.push(...taker.takers);
      continue;
    }
    if (taker !== never) {
      t.push(taker);
    }
  }

  const takersLength = t.length;

  if (takersLength === 0) {
    return none;
  }
  if (takersLength === 1) {
    return toTaker(t[0]);
  }
  return createOrTaker(t);
}

export interface OrTaker extends InternalTaker {
  type: InternalTakerType.OR;
  takers: readonly TakerLike[];
}

export function createOrTaker(takers: TakerLike[]): OrTaker {

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

    for (let i = 0, j = 0; i < takersLength; ++i) {
      const taker = takers[i];

      if (isTakerCodegen(taker)) {
        code.push(taker.factory(inputVar, offsetVar, resultVar));
      } else {
        code.push(resultVar, '=', bindings[j++][0], '(', inputVar, ',', offsetVar, ');');
      }
      if (i < takersLength - 1) {
        code.push('if(', resultVar, '===' + ResultCode.NO_MATCH + '){');
        tailCode.push('}');
      }
    }
    code.push(tailCode);

    return code;
  };

  const taker = compileInternalTaker<OrTaker>(InternalTakerType.OR, factory, bindings);

  taker.takers = takers;

  return taker;
}
