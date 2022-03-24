import {char, InternalTaker, InternalTakerType, never, none, regex, ResultCode, text} from '../main';
import {
  createUntilCaseSensitiveTextTaker,
  createUntilCharCodeCheckerTaker,
  createUntilGenericTaker,
  createUntilRegexTaker,
  until
} from '../main/until';

describe('until', () => {

  test('returns none', () => {
    expect(until(none)).toBe(none);
  });

  test('returns never', () => {
    expect(until(never)).toBe(never);
  });

  test('returns UntilCaseSensitiveTextTaker', () => {
    expect((until(text('a')) as InternalTaker).type).toBe(InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT);
    expect((until(text('aaa')) as InternalTaker).type).toBe(InternalTakerType.UNTIL_CASE_SENSITIVE_TEXT);
  });

  test('returns UntilCharCodeCheckerTaker', () => {
    expect((until(char(() => false)) as InternalTaker).type).toBe(InternalTakerType.UNTIL_CHAR_CODE_CHECKER);
  });

  test('returns UntilRegexTaker', () => {
    expect((until(regex(/a/)) as InternalTaker).type).toBe(InternalTakerType.UNTIL_REGEX);
  });

  test('returns UntilCharCodeCheckerTaker', () => {
    expect((until(() => 0) as InternalTaker).type).toBe(InternalTakerType.UNTIL_GENERIC);
  });
});

describe('createUntilCaseSensitiveTextTaker', () => {

  test('takes chars until substr is met', () => {
    expect(createUntilCaseSensitiveTextTaker('b', false, false, 0)('aaabbb', 0)).toBe(3);
  });

  test('takes chars including substr', () => {
    expect(createUntilCaseSensitiveTextTaker('b', true, false, 0)('aaabbb', 0)).toBe(4);
  });
});

describe('createUntilCharCodeCheckerTaker', () => {

  test('takes chars until char is met', () => {
    expect(createUntilCharCodeCheckerTaker((charCode) => charCode === 'b'.charCodeAt(0), false, false, 0)('aaabbb', 0)).toBe(3);
  });
});

describe('createUntilRegexTaker', () => {

  test('takes until regex is met', () => {
    expect(createUntilRegexTaker(/b/, false, false, 0)('aaabbbaaabbb', 0)).toBe(3);
    expect(createUntilRegexTaker(/b/, false, false, 0)('aaabbbaaabbb', 6)).toBe(9);
    expect(createUntilRegexTaker(/c/, false, false, 0)('aaabbbaaabbb', 6)).toBe(ResultCode.NO_MATCH);
  });

  test('takes chars including matched substr', () => {
    expect(createUntilRegexTaker(/bb/, true, false, 0)('aaabbbb', 0)).toBe(5);
  });

  test('takes open-ended', () => {
    expect(createUntilRegexTaker(/c/, false, true, 0)('aaabbb', 0)).toBe(6);
    expect(createUntilRegexTaker(/c/, false, true, 3)('aaabbb', 0)).toBe(9);
  });
});

describe('createUntilGenericTaker', () => {

  test('advances taker by one char on each iteration', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(0);

    expect(createUntilGenericTaker(takerMock, false, false, 0)('aaaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('takes inclusive', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(77);

    expect(createUntilGenericTaker(takerMock, true, false, 0)('aaaa', 0)).toBe(77);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('can use inline takers', () => {
    expect(createUntilGenericTaker(text('bb'), false, false, 0)('aabbcc', 0)).toBe(2);
  });
});
