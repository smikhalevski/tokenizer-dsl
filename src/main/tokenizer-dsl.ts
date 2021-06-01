/**
 * Takes the string `input` and the offset in this string `offset` and returns the new offset in `input` if taker
 * matched or a result code if taker didn't match. The taker may return offsets that exceed the `input` length.
 */
export type Taker = (input: string, offset: number) => ResultCode | number;

export type CharCodeChecker = (charCode: number) => boolean;

export const enum ResultCode {

  /**
   * This is an OK return code that means that taker didn't match any chars.
   */
  NO_MATCH = -1,

  /**
   * This is an error return code that means that a generic error occurred during parsing. Further parsing should be
   * aborted if this code is returned.
   */
  ERROR = -2,
}

/**
 * Creates a taker that takes a single char that matches the code.
 */
export function char(charCode: number): Taker {
  return (input, offset) => input.charCodeAt(offset) === charCode ? offset + 1 : ResultCode.NO_MATCH;
}

/**
 * Creates a taker that takes a single char if it matches the checker.
 */
export function charBy(charCodeChecker: CharCodeChecker): Taker {
  return (input, offset) => charCodeChecker(input.charCodeAt(offset)) ? offset + 1 : ResultCode.NO_MATCH;
}

/**
 * Creates a taker that takes the text.
 *
 * @param text The text to match.
 * @param [ignoreCase = false] If set to `true` then string comparison is case insensitive.
 */
export function text(text: string, ignoreCase = false): Taker {
  const charCount = text.length;

  if (ignoreCase) {
    text = text.toLowerCase();
  }

  return (input, offset) => {
    input = input.substr(offset, charCount);
    if (ignoreCase) {
      input = input.toLowerCase();
    }
    return input === text ? offset + charCount : ResultCode.NO_MATCH;
  };
}

/**
 * Creates a taker that takes all chars until termination char is met.
 *
 * **Note:** If both `inclusive` and `openEnded` are set to true and the termination char wasn't found then
 * `str.length + 1` is returned.
 *
 * @param charCodeChecker The char checker that returns `true` for termination char code.
 * @param [inclusive = false] If set to `true` then termination char is included in match.
 * @param [openEnded = false] If set to `true` and termination char wasn't found then length of the string is returned.
 *     Otherwise {@link ResultCode.NO_MATCH} is returned.
 */
export function untilCharBy(charCodeChecker: CharCodeChecker, inclusive = false, openEnded = false): Taker {
  return (input, offset) => {
    const charCount = input.length;

    while (offset < charCount) {
      if (charCodeChecker(input.charCodeAt(offset))) {
        return inclusive ? offset + 1 : offset;
      }
      offset++;
    }
    return openEnded ? inclusive ? offset + 1 : offset : ResultCode.NO_MATCH;
  };
}

/**
 * Creates taker that takes all chars until termination text is met.
 *
 * **Note:** If both `inclusive` and `openEnded` are set to true and the termination text wasn't found then
 * `str.length + text.length` is returned.
 *
 * @param text The termination text.
 * @param [inclusive = false] If set to `true` then termination text is included in match.
 * @param [openEnded = false] If set to `true` and termination text isn't found then length of the string is returned.
 *     Otherwise {@link ResultCode.NO_MATCH} is returned.
 */
export function untilText(text: string, inclusive: boolean, openEnded: boolean): Taker {
  return (input, offset) => {
    let index = input.indexOf(text, offset);

    if (index === -1) {
      if (!openEnded) {
        return ResultCode.NO_MATCH;
      }
      index = input.length;
    }
    return inclusive ? index + text.length : index;
  };
}

/**
 * Creates taker that returns `taker` result or current offset if taker returned {@link ResultCode.NO_MATCH}.
 *
 * @param taker The taker which match must be considered optional.
 */
export function maybe(taker: Taker): Taker {
  return (input, offset) => {
    const result = taker(input, offset);
    return result === ResultCode.NO_MATCH ? offset : result;
  };
}

/**
 * Creates taker that repeatedly takes chars that `taker` takes.
 *
 * @param taker The taker that takes chars.
 */
export function all(taker: Taker): Taker {
  return (input, offset) => {
    const charCount = input.length;

    while (offset < charCount) {
      const result = taker(input, offset);

      if (result === ResultCode.NO_MATCH || result === offset) {
        break;
      }
      if (result < ResultCode.NO_MATCH) {
        return result;
      }
      offset = result;
    }
    return offset;
  };
}

/**
 * Performance optimization for `all(charBy(…))` composition.
 */
export function allCharBy(charCodeChecker: CharCodeChecker): Taker {
  return (input, offset) => {
    const charCount = input.length;

    while (offset < charCount && charCodeChecker(input.charCodeAt(offset))) {
      offset++;
    }
    return offset;
  };
}

/**
 * Creates taker that takes chars using `takers` executing them one after another as a sequence.
 */
export function seq(...takers: Array<Taker>): Taker {
  const takerCount = takers.length;

  return (input, offset) => {
    for (let i = 0; i < takerCount && offset >= 0; i++) {
      offset = takers[i](input, offset);
    }
    return offset;
  };
}

/**
 * Creates taker that returns the result of the first taker that matched.
 */
export function or(...takers: Array<Taker>): Taker {
  const takerCount = takers.length;

  return (input, offset) => {
    let result = ResultCode.NO_MATCH;

    for (let i = 0; i < takerCount && result === ResultCode.NO_MATCH; i++) {
      result = takers[i](input, offset);
    }
    return result;
  };
}
