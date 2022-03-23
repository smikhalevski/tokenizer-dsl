import {CharCodeCheckerTaker, CharCodeRangeTaker, createCharCodeRangeCondition} from './char';
import {createTaker, createVar, js} from './js';
import {never} from './never';
import {none} from './none';
import {RegexTaker} from './regex';
import {
  CharCodeChecker,
  CharCodeRange,
  InternalTaker,
  ResultCode,
  Taker,
  TakerCodeFactory,
  TakerType
} from './taker-types';
import {isInternalTaker, isTaker} from './taker-utils';
import {CaseSensitiveTextTaker} from './text';

export interface UntilOptions {

  /**
   * If set to `true` then chars matched by `taker` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;

  /**
   * If set to `true` and requested taker didn't match then the input length plus {@link endOffset} is returned.
   * Otherwise, {@link ResultCode.NO_MATCH} is returned.
   *
   * @default false
   */
  openEnded?: boolean;

  /**
   * Additional offset for open-ended takers.
   *
   * @default 0
   */
  endOffset?: number;
}

/**
 * Creates taker that takes chars until `taker` matches.
 *
 * @param taker The taker that takes chars.
 * @param options Taker options.
 */
export function until(taker: Taker, options: UntilOptions = {}): Taker {

  const {
    inclusive = false,
    openEnded = false,
    endOffset = 0,
  } = options;

  if (taker === never || taker === none || isUntilTaker(taker)) {
    return taker;
  }
  if (isTaker<RegexTaker>(taker, TakerType.REGEX)) {
    return createUntilRegexTaker(taker.__re, inclusive, openEnded, endOffset);
  }
  if (isTaker<CharCodeRangeTaker>(taker, TakerType.CHAR_CODE_RANGE)) {
    return createUntilCharCodeRangeTaker(taker.__charCodeRanges, inclusive, openEnded, endOffset);
  }
  if (isTaker<CaseSensitiveTextTaker>(taker, TakerType.CASE_SENSITIVE_TEXT)) {
    return createUntilCaseSensitiveTextTaker(taker.__str, inclusive, openEnded, endOffset);
  }
  if (isTaker<CharCodeCheckerTaker>(taker, TakerType.CHAR_CODE_CHECKER)) {
    return createUntilCharCodeCheckerTaker(taker.__charCodeChecker, inclusive, openEnded, endOffset);
  }
  return createUntilGenericTaker(taker, inclusive, openEnded, endOffset);
}

export type UntilTaker =
    | UntilRegexTaker
    | UntilCaseSensitiveTextTaker
    | UntilCharCodeCheckerTaker
    | UntilGenericTaker;

export function isUntilTaker(taker: Taker): taker is UntilTaker {
  return isTaker<UntilRegexTaker>(taker, TakerType.UNTIL_REGEX)
      || isTaker<UntilCaseSensitiveTextTaker>(taker, TakerType.UNTIL_CASE_SENSITIVE_TEXT)
      || isTaker<UntilCharCodeCheckerTaker>(taker, TakerType.UNTIL_CHAR_CODE_CHECKER)
      || isTaker<UntilGenericTaker>(taker, TakerType.UNTIL_GENERIC);
}

export interface UntilCharCodeRangeTaker extends InternalTaker {
  __type: TakerType.UNTIL_CHAR_CODE_RANGE;
  __charCodeRanges: CharCodeRange[];
}

export function createUntilCharCodeRangeTaker(charCodeRanges: CharCodeRange[], inclusive: boolean, openEnded: boolean, endOffset: number): UntilCharCodeRangeTaker {

  const inputLengthVar = createVar();
  const indexVar = createVar();
  const charCodeVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar, ';',
      'while(', indexVar, '<', inputLengthVar, '){',
      'var ', charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
      'if(', createCharCodeRangeCondition(charCodeVar, charCodeRanges), ')break;',
      '++', indexVar,
      '}',
      resultVar, '=', indexVar, '===', inputLengthVar,
      '?', openEnded ? [inputLengthVar, '+' + endOffset] : ResultCode.NO_MATCH,
      ':', inclusive ? [indexVar, '+1'] : indexVar,
      ';'
  );

  const taker = createTaker<UntilCharCodeRangeTaker>(TakerType.UNTIL_CHAR_CODE_RANGE, factory);

  taker.__charCodeRanges = charCodeRanges;

  return taker;
}


export interface UntilCaseSensitiveTextTaker extends InternalTaker {
  __type: TakerType.UNTIL_CASE_SENSITIVE_TEXT;
}

export function createUntilCaseSensitiveTextTaker(str: string, inclusive: boolean, openEnded: boolean, endOffset: number): UntilCaseSensitiveTextTaker {

  const indexVar = createVar();
  const strVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
      resultVar, '=', indexVar, '===-1',
      '?', openEnded ? [inputVar, '.length+', endOffset] : ResultCode.NO_MATCH,
      ':', indexVar, [inclusive ? '+' + str.length : ''], ';'
  );

  return createTaker<UntilCaseSensitiveTextTaker>(TakerType.UNTIL_CASE_SENSITIVE_TEXT, factory, [[strVar, str]]);
}

export interface UntilCharCodeCheckerTaker extends Taker {
  __type: TakerType.UNTIL_CHAR_CODE_CHECKER;
}

export function createUntilCharCodeCheckerTaker(charCodeChecker: CharCodeChecker, inclusive: boolean, openEnded: boolean, endOffset: number): UntilCharCodeCheckerTaker {

  const takenOffset = inclusive ? 1 : 0;

  const take: UntilCharCodeCheckerTaker = (input, offset) => {
    const inputLength = input.length;

    let i = offset;
    while (i < inputLength && !charCodeChecker(input.charCodeAt(i))) {
      ++i;
    }
    if (i === inputLength) {
      return openEnded ? inputLength + endOffset : ResultCode.NO_MATCH;
    }
    return i + takenOffset;
  };

  take.__type = TakerType.UNTIL_CHAR_CODE_CHECKER;

  return take;
}

export interface UntilRegexTaker extends InternalTaker {
  __type: TakerType.UNTIL_REGEX;
}

export function createUntilRegexTaker(re: RegExp, inclusive: boolean, openEnded: boolean, endOffset: number): UntilRegexTaker {

  re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');

  const reVar = createVar();
  const arrVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      reVar, '.lastIndex=', offsetVar, ';',
      'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
      resultVar, '=', arrVar, '===null',
      '?', openEnded ? [inputVar, '.length+', endOffset] : ResultCode.NO_MATCH,
      ':', inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'],
      ';',
  );

  const taker = createTaker<UntilRegexTaker>(TakerType.UNTIL_REGEX, factory, [[reVar, re]]);

  taker.__type = TakerType.UNTIL_REGEX;

  return taker;
}

export interface UntilGenericTaker extends InternalTaker {
  __type: TakerType.UNTIL_GENERIC;
}

export function createUntilGenericTaker(baseTaker: Taker, inclusive: boolean, openEnded: boolean, endOffset: number): UntilGenericTaker {

  const inputLengthVar = createVar();
  const indexVar = createVar();
  const baseTakerVar = createVar();

  const factory: TakerCodeFactory = (inputVar, offsetVar, resultVar) => js(
      'var ', inputLengthVar, '=', inputVar, '.length,', indexVar, '=', offsetVar, ';',
      resultVar, '=' + ResultCode.NO_MATCH + ';',
      'while(', indexVar, '<', inputLengthVar, '&&', resultVar, '===' + ResultCode.NO_MATCH + '){',

      isInternalTaker(baseTaker) ? baseTaker.__factory(inputVar, indexVar, resultVar) : [resultVar, '=', baseTakerVar, '(', inputVar, ',', indexVar, ');'],
      '++', indexVar,
      '}',
      resultVar, '=', resultVar, '===' + ResultCode.NO_MATCH,
      '?', openEnded ? [inputLengthVar, '+' + endOffset] : resultVar,
      ':', resultVar, '<', 0, '?', resultVar,
      ':', inclusive ? resultVar : [indexVar, '-1'],
      ';',
  );

  return createTaker<UntilGenericTaker>(TakerType.UNTIL_GENERIC, factory, isInternalTaker(baseTaker) ? baseTaker.__values : [[baseTakerVar, baseTaker]]);
}
