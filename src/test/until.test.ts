import {char, InternalTaker, InternalTakerType, never, none, regex, ResultCode, text} from '../main';
import {
  createUntilCaseSensitiveTextTaker,
  createUntilCharCodeCheckerTaker, createUntilCharCodeRangeTaker,
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

  test('returns UntilCharCodeRangeTaker', () => {
    expect((until(char([97, 98])) as InternalTaker).type).toBe(InternalTakerType.UNTIL_CHAR_CODE_RANGE);
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

describe('createUntilCharCodeRangeTaker', () => {

  test('takes chars until char code is met', () => {
    expect(createUntilCharCodeRangeTaker(['b'.charCodeAt(0)], false)('aaabbb', 0)).toBe(3);
  });

  test('takes chars including the searched char', () => {
    expect(createUntilCharCodeRangeTaker(['b'.charCodeAt(0)], true)('aaabbb', 0)).toBe(4);
  });
});

describe('createUntilCaseSensitiveTextTaker', () => {

  test('takes chars until substr is met', () => {
    expect(createUntilCaseSensitiveTextTaker('b', false)('aaabbb', 0)).toBe(3);
  });

  test('takes chars including substr', () => {
    expect(createUntilCaseSensitiveTextTaker('b', true)('aaabbb', 0)).toBe(4);
  });
});

describe('createUntilCharCodeCheckerTaker', () => {

  test('takes chars until char is met', () => {
    expect(createUntilCharCodeCheckerTaker((charCode) => charCode === 'b'.charCodeAt(0), false)('aaabbb', 0)).toBe(3);
  });
});

describe('createUntilRegexTaker', () => {

  test('takes until regex is met', () => {
    expect(createUntilRegexTaker(/b/, false)('aaabbbaaabbb', 0)).toBe(3);
    expect(createUntilRegexTaker(/b/, false)('aaabbbaaabbb', 6)).toBe(9);
    expect(createUntilRegexTaker(/c/, false)('aaabbbaaabbb', 6)).toBe(ResultCode.NO_MATCH);
  });

  test('takes chars including matched substr', () => {
    expect(createUntilRegexTaker(/bb/, true)('aaabbbb', 0)).toBe(5);
  });
});

describe('createUntilGenericTaker', () => {

  test('advances taker by one char on each iteration', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(0);

    expect(createUntilGenericTaker(takerMock, false)('aaaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('takes inclusive', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(77);

    expect(createUntilGenericTaker(takerMock, true)('aaaa', 0)).toBe(77);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('can use inline takers', () => {
    expect(createUntilGenericTaker(text('bb'), false)('aabbcc', 0)).toBe(2);
  });
});
