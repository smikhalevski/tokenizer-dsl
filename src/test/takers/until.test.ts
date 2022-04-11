import {
  char,
  never,
  NO_MATCH,
  none,
  regex,
  text,
  toTakerFunction,
  until,
  UntilCaseSensitiveTextTaker,
  UntilCharCodeRangeTaker,
  UntilRegexTaker,
  UntilTaker
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
    expect(until(text('a'))).toBeInstanceOf(UntilCaseSensitiveTextTaker);
    expect(until(text('aaa'))).toBeInstanceOf(UntilCaseSensitiveTextTaker);
  });

  test('returns UntilCharCodeRangeTaker', () => {
    expect(until(char([97, 98]))).toBeInstanceOf(UntilCharCodeRangeTaker);
  });

  test('returns UntilRegexTaker', () => {
    expect(until(regex(/a/))).toBeInstanceOf(UntilRegexTaker);
  });

  test('returns UntilTaker', () => {
    expect(until(() => 0)).toBeInstanceOf(UntilTaker);
  });
});

describe('UntilCharCodeRangeTaker', () => {

  test('takes chars until char code is met', () => {
    expect(toTakerFunction(new UntilCharCodeRangeTaker([[B, B]], false))('aaabbb', 0)).toBe(3);
  });

  test('takes chars including the searched char', () => {
    expect(toTakerFunction(new UntilCharCodeRangeTaker([[B, B]], true))('aaabbb', 0)).toBe(4);
  });
});

describe('UntilCaseSensitiveTextTaker', () => {

  test('takes chars until substr is met', () => {
    expect(toTakerFunction(new UntilCaseSensitiveTextTaker('b', false))('aaabbb', 0)).toBe(3);
  });

  test('takes chars including substr', () => {
    expect(toTakerFunction(new UntilCaseSensitiveTextTaker('b', true))('aaabbb', 0)).toBe(4);
  });
});

describe('UntilRegexTaker', () => {

  test('takes until regex is met', () => {
    expect(toTakerFunction(new UntilRegexTaker(/b/, false))('aaabbbaaabbb', 0)).toBe(3);
    expect(toTakerFunction(new UntilRegexTaker(/b/, false))('aaabbbaaabbb', 6)).toBe(9);
    expect(toTakerFunction(new UntilRegexTaker(/c/, false))('aaabbbaaabbb', 6)).toBe(NO_MATCH);
  });

  test('takes chars including matched substr', () => {
    expect(toTakerFunction(new UntilRegexTaker(/bb/, true))('aaabbbb', 0)).toBe(5);
  });
});

describe('UntilTaker', () => {

  test('advances taker by one char on each iteration', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(0);

    expect(toTakerFunction(new UntilTaker(takerMock, false))('aaaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('takes inclusive', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(77);

    expect(toTakerFunction(new UntilTaker(takerMock, true))('aaaa', 0)).toBe(77);
    expect(takerMock).toHaveBeenCalledTimes(3);
    expect(takerMock).toHaveBeenNthCalledWith(3, 'aaaa', 2);
  });

  test('can use inline takers', () => {
    expect(toTakerFunction(new UntilTaker(text('bb'), false))('aabbcc', 0)).toBe(2);
  });
});
