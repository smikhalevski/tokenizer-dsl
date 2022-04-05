import {Code, Var} from '../code';
import {createVar} from '../code';
import {none} from './none';
import {
  CharCodeChecker,
  CharCodeRange,
  CharCodeRangeLike,
  InternalTaker,
  InternalTakerType,
  ResultCode,
  TakerFunction,
  TakerCodeFactory
} from './taker-types';
import {compileInternalTaker, toCharCodeRanges} from './taker-utils';

/**
 * Creates a taker that matches a single char by its code.
 *
 * @param charCode A function that receives a char code from the input and returns `true` if it matches. Or an array of
 * char codes, or tuples of lower/upper char codes that define an inclusive range of codes.
 *
 * @see {@link text}
 */
export function char(charCode: CharCodeChecker | CharCodeRangeLike[]): TakerFunction {
  if (typeof charCode === 'function') {
    return createCharCodeCheckerTaker(charCode);
  }
  const ranges = toCharCodeRanges(charCode);

  if (ranges.length === 0) {
    return none;
  }
  return createCharCodeRangeTaker(ranges);
}

export interface CharCodeCheckerTaker extends InternalTaker {
  type: InternalTakerType.CHAR_CODE_CHECKER;
  charCodeChecker: CharCodeChecker;
}

export function createCharCodeCheckerTaker(charCodeChecker: CharCodeChecker): CharCodeCheckerTaker {

  const charCodeCheckerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => [
    resultVar, '=', charCodeCheckerVar, '(', inputVar, '.charCodeAt(', offsetVar, '))?', offsetVar, '+1:' + ResultCode.NO_MATCH + ';',
  ];

  const taker = compileInternalTaker<CharCodeCheckerTaker>(InternalTakerType.CHAR_CODE_CHECKER, factory, [[charCodeCheckerVar, charCodeChecker]]);

  taker.charCodeChecker = charCodeChecker;

  return taker;
}

export interface CharCodeRangeTaker extends InternalTaker {
  type: InternalTakerType.CHAR_CODE_RANGE;
  charCodeRanges: CharCodeRange[];
}

export function createCharCodeRangeTaker(charCodeRanges: CharCodeRange[]): CharCodeRangeTaker {

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => {
    const charCodeVar = createVar();

    return [
      'var ', charCodeVar, '=', inputVar, '.charCodeAt(', offsetVar, ');',
      resultVar, '=', createCharPredicate(charCodeVar, charCodeRanges), '?', offsetVar, '+1:' + ResultCode.NO_MATCH + ';',
    ];
  };

  const taker = compileInternalTaker<CharCodeRangeTaker>(InternalTakerType.CHAR_CODE_RANGE, factory);

  taker.charCodeRanges = charCodeRanges;

  return taker;
}

export function createCharPredicate(charCodeVar: Var, charCodeRanges: CharCodeRange[]): Code {
  const code: Code[] = [];

  for (let i = 0; i < charCodeRanges.length; ++i) {
    const range = charCodeRanges[i];

    if (typeof range === 'number') {
      code.push(i > 0 ? '||' : '', charCodeVar, '===', range);
    } else {
      code.push(i > 0 ? '||' : '', charCodeVar, '>=', range[0], '&&', charCodeVar, '<=', range[1]);
    }
  }
  return code;
}
