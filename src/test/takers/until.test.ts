import {char, InternalTaker, never, NO_MATCH, none, regex, text} from '../../main';
import {
  createUntilCaseSensitiveTextTaker,
  createUntilCharCodeCheckerTaker,
  createUntilCharCodeRangeTaker,
  createUntilGenericTaker,
  createUntilRegexTaker,
  until
} from '../../main/takers';

const B = 'b'.charCodeAt(0);

describe('until', () => {

  test('returns none', () => {
    expect(until(none)).toBe(none);
  });

  test('returns never', () => {
    expect(until(never)).toBe(never);
  });

  test('returns UntilCaseSensitiveTextTaker', () => {
    expect((until(text('a')) as InternalTaker).type).toBe(UNTIL_CASE_SENSITIVE_TEXT_TYPE);
    expect((until(text('aaa')) as InternalTaker).type).toBe(UNTIL_CASE_SENSITIVE_TEXT_TYPE);
  });

  test('returns UntilCharCodeRangeTaker', () => {
    expect((until(char([97, 98])) as InternalTaker).type).toBe(UNTIL_CHAR_CODE_RANGE_TYPE);
  });

  test('returns UntilCharCodeCheckerTaker', () => {
    expect((until(char(() => false)) as InternalTaker).type).toBe(UNTIL_CHAR_CODE_CHECKER_TYPE);
  });

  test('returns UntilRegexTaker', () => {
    expect((until(regex(/a/)) as InternalTaker).type).toBe(UNTIL_REGEX_TYPE);
  });

  test('returns UntilCharCodeCheckerTaker', () => {
    expect((until(() => 0) as InternalTaker).type).toBe(UNTIL_GENERIC_TYPE);
  });
});

describe('createUntilCharCodeRangeTaker', () => {

  test('takes chars until char code is met', () => {
    expect(createUntilCharCodeRangeTaker([[B, B]], false)('aaabbb', 0)).toBe(3);
  });

  test('takes chars including the searched char', () => {
    expect(createUntilCharCodeRangeTaker([[B, B]], true)('aaabbb', 0)).toBe(4);
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
    expect(createUntilCharCodeCheckerTaker((charCode) => charCode === B, false)('aaabbb', 0)).toBe(3);
  });
});

describe('createUntilRegexTaker', () => {

  test('takes until regex is met', () => {
    expect(createUntilRegexTaker(/b/, false)('aaabbbaaabbb', 0)).toBe(3);
    expect(createUntilRegexTaker(/b/, false)('aaabbbaaabbb', 6)).toBe(9);
    expect(createUntilRegexTaker(/c/, false)('aaabbbaaabbb', 6)).toBe(NO_MATCH);
  });

  test('takes chars including matched substr', () => {
    expect(createUntilRegexTaker(/bb/, true)('aaabbbb', 0)).toBe(5);
  });
});

describe('createUntilGenericTaker', () => {

  test('advances taker by one char on each iteration', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(0);

    expect(createUntilGenericTaker(takerMock, false)('aaaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('takes inclusive', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(77);

    expect(createUntilGenericTaker(takerMock, true)('aaaa', 0)).toBe(77);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('can use inline takers', () => {
    expect(createUntilGenericTaker(text('bb'), false)('aabbcc', 0)).toBe(2);
  });
});
