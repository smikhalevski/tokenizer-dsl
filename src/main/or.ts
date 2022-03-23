import {createTaker, createVar, js, VarNode} from './js';
import {never} from './never';
import {none} from './none';
import {InternalTaker, ResultCode, Taker, TakerCodeFactory, TakerType} from './taker-types';
import {isInternalTaker, isTaker} from './taker-utils';

/**
 * Returns the result of the first matched taker.
 *
 * @param takers Takers that are called.
 */
export function or(...takers: Taker[]): Taker {

  takers = takers.reduce<Taker[]>((takers, taker) => {

    if (takers.length !== 0 && takers[takers.length - 1] === none) {
      return takers;
    }
    if (isTaker<OrTaker>(taker, TakerType.OR)) {
      takers.push(...taker.__takers);
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
    return takers[0];
  }
  return createOrTaker(takers);
}

export interface OrTaker extends InternalTaker {
  __type: TakerType.OR;
  __takers: Taker[];
}

export function createOrTaker(takers: Taker[]): OrTaker {

  const takersLength = takers.length;

  const takerVars: VarNode[] = [];

  const values = takers.reduce<[VarNode, unknown][]>((values, taker, i) => {
    if (isInternalTaker(taker)) {
      values.push(...taker.__values);
    } else {
      values.push([takerVars[i] = createVar(), taker]);
    }
    return values;
  }, []);

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {

    const node = js();
    const lastNode = js();

    for (let i = 0; i < takersLength; ++i) {
      const taker = takers[i];

      node.push(isInternalTaker(taker) ? taker.__factory(inputVar, offsetVar, resultVar) : [resultVar, '=', takerVars[i], '(', inputVar, ',', offsetVar, ');']);

      if (i !== takersLength - 1) {
        node.push('if(', resultVar, '===' + ResultCode.NO_MATCH + '){');
        lastNode.push('}');
      }
    }
    return node.push(lastNode);
  };
  const taker = createTaker<OrTaker>(TakerType.OR, factory, values);

  taker.__takers = takers;

  return taker;
}
