import {never} from './never';
import {none} from './none';
import {ResultCode, Taker, TakerType} from './taker-types';
import {isTaker} from './taker-utils';

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

export interface OrTaker extends Taker {
  __type: TakerType.OR;
  __takers: Taker[];
}

export function createOrTaker(takers: Taker[]): OrTaker {

  const takersLength = takers.length;

  const k1 = takersLength - 2;
  const k2 = takersLength - 1;

  let js = 'var ';

  for (let i = 0; i < takersLength; ++i) {
    js += 't' + i + '=q[' + i + ']' + (i < k2 ? ',' : ';');
  }

  js += 'return function(i,o){';

  for (let i = 0; i < k1; ++i) {
    js += 'var r' + i + '=t' + i + '(i,o);'
        + 'if(r' + i + '!==' + ResultCode.NO_MATCH + '){return r' + i + '}';
  }

  js += 'var r' + k1 + '=t' + k1 + '(i,o);'
      + 'return r' + k1 + '!==' + ResultCode.NO_MATCH + '?r' + k1 + ':' + 't' + k2 + '(i,o)}';

  const take: OrTaker = Function('q', js)(takers);

  take.__type = TakerType.OR;
  take.__takers = takers;

  return take;
}
