import {char, never, none, regex, ResultCode, TakerType, text} from '../main';
import {createUntilCaseSensitiveTextTaker, createUntilCharTaker, createUntilRegexTaker, until} from '../main/until';

describe('until', () => {

  test('returns none', () => {
    expect(until(none)).toBe(none);
  });

  test('returns never', () => {
    expect(until(never)).toBe(never);
  });

  test('returns UntilCaseSensitiveTextTaker', () => {
    expect(until(text('a')).__type).toBe(TakerType.UNTIL_CASE_SENSITIVE_TEXT);
    expect(until(text('aaa')).__type).toBe(TakerType.UNTIL_CASE_SENSITIVE_TEXT);
  });

  test('returns UntilCharTaker', () => {
    expect(until(char(() => false)).__type).toBe(TakerType.UNTIL_CHAR);
  });

  test('returns UntilRegexTaker', () => {
    expect(until(regex(/a/)).__type).toBe(TakerType.UNTIL_REGEX);
  });

  test('returns UntilCharTaker', () => {
    expect(until(() => 0).__type).toBe(TakerType.UNTIL_GENERIC);
  });
});

describe('createUntilCaseSensitiveTextTaker', () => {

  test('reads chars until substr is met', () => {
    expect(createUntilCaseSensitiveTextTaker('b', false, false, 0)('aaabbb', 0)).toBe(3);
  });

  test('reads chars including substr', () => {
    expect(createUntilCaseSensitiveTextTaker('b', true, false, 0)('aaabbb', 0)).toBe(4);
  });
});

describe('createUntilCharTaker', () => {

  test('reads chars until char is met', () => {
    expect(createUntilCharTaker((charCode) => charCode === 'b'.charCodeAt(0), false, false, 0)('aaabbb', 0)).toBe(3);
  });
});

describe('createUntilRegexTaker', () => {

  test('reads until regex is met', () => {
    expect(createUntilRegexTaker(/b/, false, false, 0)('aaabbbaaabbb', 0)).toBe(3);
    expect(createUntilRegexTaker(/b/, false, false, 0)('aaabbbaaabbb', 6)).toBe(9);
    expect(createUntilRegexTaker(/c/, false, false, 0)('aaabbbaaabbb', 6)).toBe(ResultCode.NO_MATCH);
  });

  test('reads chars including matched substr', () => {
    expect(createUntilRegexTaker(/bb/, true, false, 0)('aaabbbb', 0)).toBe(5);
  });

  test('reads open-ended', () => {
    expect(createUntilRegexTaker(/c/, false, true, 0)('aaabbb', 0)).toBe(6);
    expect(createUntilRegexTaker(/c/, false, true, 3)('aaabbb', 0)).toBe(9);
  });
});

// describe('createUntilTaker', () => {
//
//   test('', () => {
//   });
// });
