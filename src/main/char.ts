import {CodeNode, createTaker, createVar, js, VarNode} from './js';
import {none} from './none';
import {
  CharCodeChecker,
  CharCodeRange,
  InternalTaker,
  ResultCode,
  Taker,
  TakerCodeFactory,
  TakerType
} from './taker-types';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCode A function that receives a char code from the input and returns `true` if it matches.
 * @see {@link text}
 */
export function char(charCode: CharCodeChecker | CharCodeRange[]): Taker {
  if (typeof charCode === 'function') {
    return createCharCodeCheckerTaker(charCode);
  }
  if (charCode.length === 0) {
    return none;
  }
  return createCharCodeRangeTaker(charCode);
}

export interface CharCodeCheckerTaker extends Taker {
  __type: TakerType.CHAR_CODE_CHECKER;
  __charCodeChecker: CharCodeChecker;
}

export function createCharCodeCheckerTaker(charCodeChecker: CharCodeChecker): CharCodeCheckerTaker {

  const take: CharCodeCheckerTaker = (input, offset) => {
    return charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
  };

  take.__type = TakerType.CHAR_CODE_CHECKER;
  take.__charCodeChecker = charCodeChecker;

  return take;
}

export interface CharCodeRangeTaker extends InternalTaker {
  __type: TakerType.CHAR_CODE_RANGE;
  __charCodeRanges: CharCodeRange[];
}

export function createCharCodeRangeTaker(charCodeRanges: CharCodeRange[]): CharCodeRangeTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const charCodeVar = createVar();
    return js(
        'var ', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, ');',
        resultVar, '=', createCharCodeRangeCondition(charCodeVar, charCodeRanges), '?', offsetVar, '+1:' + ResultCode.NO_MATCH + ';'
    );
  };

  const take = createTaker<CharCodeRangeTaker>(TakerType.CHAR_CODE_RANGE, factory);

  take.__charCodeRanges = charCodeRanges;

  return take;
}

export function createCharCodeRangeCondition(charCodeVar: VarNode, charCodeRanges: CharCodeRange[]): CodeNode {
  const node = js();

  for (let i = 0; i < charCodeRanges.length; ++i) {
    if (i !== 0) {
      node.push('||');
    }
    const range = charCodeRanges[i];
    if (typeof range === 'number') {
      node.push(charCodeVar, '===', range);
    } else {
      node.push(charCodeVar, '>=', range[0], '&&', charCodeVar, '<=', range[1]);
    }
  }

  return node;
}
