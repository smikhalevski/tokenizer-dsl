import {Code, createVar, Var} from '../code';
import {InternalTaker, OR_TYPE} from './internal-taker-types';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Taker} from './taker-types';
import {isInternalTaker, isTakerCodegen} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Taker[]): Taker {

  const children: Taker[] = [];

  for (const taker of takers) {
    if (taker === none) {
      break;
    }
    if (isInternalTaker<OrTaker>(OR_TYPE, taker)) {
      children.push(...taker.takers);
      continue;
    }
    if (taker !== never) {
      children.push(taker);
    }
  }

  const takersLength = children.length;

  if (takersLength === 0) {
    return none;
  }
  if (takersLength === 1) {
    return children[0];
  }
  return createOrTaker(children);
}

export interface OrTaker extends InternalTaker {
  type: OR_TYPE;
  takers: Taker[];
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
      const takerVar = createVar();
      bindings.push([takerVar, taker]);
    }
  }

  return {
    type: OR_TYPE,
    bindings,
    takers,

    factory(inputVar, offsetVar, resultVar) {

      const code: Code[] = [];

      for (let i = 0; i < takersLength; ++i) {
        const taker = takers[i];

        if (isTakerCodegen(taker)) {
          code.push(taker.factory(inputVar, offsetVar, resultVar));
        } else {
          for (const binding of bindings) {
            if (binding[1] === taker) {
              code.push(resultVar, '=', binding[0], '(', inputVar, ',', offsetVar, ');');
            }
          }
        }
        if (i < takersLength - 1) {
          code.push('if(', resultVar, '===', NO_MATCH, '){');
        }
      }
      code.push('}'.repeat(takersLength - 1));

      return code;
    },
  };
}
