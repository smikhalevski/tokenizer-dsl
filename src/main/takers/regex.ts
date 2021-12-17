import {ResultCode, Taker, TakerType} from '../taker-types';
import {withType} from '../taker-utils';

export function regex(re: RegExp): Taker {

  if (re.sticky !== undefined) {
    if (!re.sticky) {
      re = RegExp(re, re.flags + 'y');
    }
  } else {
    if (!re.global) {
      re = RegExp(re, re.flags + 'g');
    }
  }

  return withType(TakerType.REGEX, re, (input, offset) => {
    re.lastIndex = offset;
    const result = re.exec(input);

    return result === null || result.index !== offset ? ResultCode.NO_MATCH : re.lastIndex;
  });
}
