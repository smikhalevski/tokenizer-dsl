import {Code, Var} from '../code-types';
import {createVar} from '../code-utils';
import {never} from './never';
import {none} from './none';
import {InternalTaker, InternalTakerType, Taker, TakerCodeFactory, TakerLike} from './taker-types';
import {compileInternalTaker, isInternalTaker, isTakerCodegen, toTaker} from './taker-utils';

/**
 * Creates a taker that applies takers one after another.
 *
 * @param takers Takers that are called.
 */
export function seq(...takers: TakerLike[]): Taker {
  if (takers.includes(never)) {
    return never;
  }

  const t: TakerLike[] = [];

  for (const taker of takers) {
    if (isInternalTaker<SeqTaker>(taker, InternalTakerType.SEQ)) {
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
    return toTaker(t[0]);
  }
  return createSeqTaker(t);
}

export interface SeqTaker extends InternalTaker {
  type: InternalTakerType.SEQ;
  takers: TakerLike[];
}

export function createSeqTaker(takers: TakerLike[]): SeqTaker {

  const takersLength = takers.length;
  const bindings: [Var, unknown][] = [];

  for (const taker of takers) {
    if (!isTakerCodegen(taker)) {
      bindings.push([createVar(), taker]);
      continue;
    }
    if (taker.bindings) {
      bindings.push(...taker.bindings);
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

  const taker = compileInternalTaker<SeqTaker>(InternalTakerType.SEQ, factory, bindings);

  taker.takers = takers;

  return taker;
}
