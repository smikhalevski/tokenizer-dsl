import {ResultCode, Taker} from '../taker-types';
import {TakerType} from './TakerType';

export function regex(re: RegExp): Taker {
  return createRegexTaker(re);
}

export interface RegexTaker extends Taker {
  __type: TakerType.RegexTaker;
  __re: RegExp;
}

export function createRegexTaker(re: RegExp): RegexTaker {

  re = new RegExp(re.source, re.flags.replace(/[yg]/, '') + (re.sticky !== undefined ? 'y' : 'g'));

  const take: RegexTaker = (input, offset) => {
    re.lastIndex = offset;

    const result = re.exec(input);

    return result === null || result.index !== offset ? ResultCode.NO_MATCH : re.lastIndex;
  };

  take.__type = TakerType.RegexTaker;
  take.__re = re;

  return take;
}
