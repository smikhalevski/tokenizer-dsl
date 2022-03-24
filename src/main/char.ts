import {Code, createInternalTaker, createVar, VarNode} from './js';
import {none} from './none';
import {
  CharCodeChecker,
  CharCodeRange,
  InternalTaker,
  InternalTakerType,
  ResultCode,
  Taker,
  TakerCodeFactory,
  TakerCodegen
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

export interface CharCodeCheckerTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.CHAR_CODE_CHECKER;
  charCodeChecker: CharCodeChecker;
}

export function createCharCodeCheckerTaker(charCodeChecker: CharCodeChecker): CharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', offsetVar, '))?', offsetVar, '+1:' + ResultCode.NO_MATCH + ';',
  ];

  const taker = createInternalTaker<CharCodeCheckerTaker>(InternalTakerType.CHAR_CODE_CHECKER, factory, [[charCodeCheckerVar, charCodeChecker]]);

  taker.charCodeChecker = charCodeChecker;

  return taker;
}

export interface CharCodeRangeTaker extends InternalTaker, TakerCodegen {
  type: InternalTakerType.CHAR_CODE_RANGE;
  charCodeRanges: CharCodeRange[];
}

export function createCharCodeRangeTaker(charCodeRanges: CharCodeRange[]): CharCodeRangeTaker {

  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    'var ', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, ');',
    resultVar, '=', createCharPredicate(charCodeVar, charCodeRanges), '?', offsetVar, '+1:' + ResultCode.NO_MATCH + ';',
  ];

  const taker = createInternalTaker<CharCodeRangeTaker>(InternalTakerType.CHAR_CODE_RANGE, factory);

  taker.charCodeRanges = charCodeRanges;

  return taker;
}

export function createCharPredicate(charCodeVar: VarNode, charCodeRanges: CharCodeRange[]): Code {
  return charCodeRanges.map((value, i) => [
    i === 0 ? '' : '||',
    typeof value === 'number' ? [charCodeVar, '===', value] : [charCodeVar, '>=', value[0], '&&', charCodeVar, '<=', value[1]],
  ]);
}
