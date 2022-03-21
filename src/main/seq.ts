import {never} from './never';
import {none} from './none';
import {Taker, TakerType} from './taker-types';
import {isTaker} from './taker-utils';

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

export interface SeqTaker extends Taker {
  __type: TakerType.SEQ;
  __takers: Taker[];
}

export function createSeqTaker(takers: Taker[]): SeqTaker {

  const takersLength = takers.length;

  const k1 = takersLength - 2;
  const k2 = takersLength - 1;

  let js = 'var ';

  for (let i = 0; i < takersLength; ++i) {
    js += 't' + i + '=q[' + i + ']' + (i < k2 ? ',' : ';');
  }

  js += 'return function(i,o){';

  let offsetVar = 'o';

  for (let i = 0; i < k1; ++i) {
    js += 'var r' + i + '=t' + i + '(i,' + offsetVar + ');'
        + 'if(r' + i + '<0){return r' + i + '}';

    offsetVar = 'r' + i;
  }

  js += 'var r' + k1 + '=t' + k1 + '(i,' + offsetVar + ');'
      + 'return r' + k1 + '<0?r' + k1 + ':' + 't' + k2 + '(i,r' + k1 + ')}';

  const take: SeqTaker = Function('q', js)(takers);

  take.__type = TakerType.SEQ;
  take.__takers = takers;

  return take;
}
