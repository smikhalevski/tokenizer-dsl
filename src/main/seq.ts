import {createTaker, createVar, js, VarNode} from './js';
import {never} from './never';
import {none} from './none';
import {InternalTaker, Taker, TakerCodeFactory, TakerType} from './taker-types';
import {isInternalTaker, isTaker} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: Taker[]): Taker {
  if (takers.includes(never)) {
    return never;
  }

  takers = takers.reduce<Taker[]>((takers, taker) => {
    if (isTaker<SeqTaker>(taker, TakerType.SEQ)) {
      takers.push(...taker.__takers);
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
    return takers[0];
  }
  return createSeqTaker(takers);
}

export interface SeqTaker extends InternalTaker {
  __type: TakerType.SEQ;
  __takers: Taker[];
}

export function createSeqTaker(takers: Taker[]): SeqTaker {

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

      if (i === takersLength - 1) {
        node.push(isInternalTaker(taker) ? taker.__factory(inputVar, offsetVar, resultVar) : [resultVar, '=', takerVars[i], '(', inputVar, ',', offsetVar, ');']);
      } else {
        node.push(
            isInternalTaker(taker) ? taker.__factory(inputVar, offsetVar, offsetVar) : [offsetVar, '=', takerVars[i], '(', inputVar, ',', offsetVar, ');'],
            'if(', offsetVar, '<0){', resultVar, '=', offsetVar, '}else{'
        );
        lastNode.push('}');
      }
    }
    return node.push(lastNode);
  };

  const taker = createTaker<SeqTaker>(TakerType.SEQ, factory, values);

  taker.__takers = takers;

  return taker;
}
