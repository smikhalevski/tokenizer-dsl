import {Code, createVar, Var} from '../code';
import {InternalTaker, OR_TYPE} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Taker, TakerCodeFactory} from './taker-types';
import {createInternalTaker, isInternalTaker, isTakerCodegen, toTakerFunction} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Taker[]): Taker {

  const t: Taker[] = [];

  for (const taker of takers) {
    if (taker === none) {
      break;
    }
    if (isInternalTaker<OrTaker>(OR_TYPE, taker)) {
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
    return toTakerFunction(t[0]);
  }
  return createOrTaker(t);
}

export interface OrTaker extends InternalTaker {
  type: OR_TYPE;
  takers: readonly Taker[];
}

export function createOrTaker(takers: Taker[]): OrTaker {

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
        code.push('if(', resultVar, '===' + NO_MATCH + '){');
        tailCode.push('}');
      }
    }
    code.push(tailCode);

    return code;
  };

  const taker = createInternalTaker<OrTaker>(OR_TYPE, factory, bindings);

  taker.takers = takers;

  return taker;
}
