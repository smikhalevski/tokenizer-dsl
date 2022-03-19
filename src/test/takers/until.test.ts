import {until, UntilCaseSensitiveTextTaker, UntilCharTaker, UntilRegexTaker, UntilTaker} from '../../main/takers/until';
import {char, never, none, regex, ResultCode, text} from '../../main';

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

  test('returns UntilCharTaker', () => {
    expect(until(char(() => false))).toBeInstanceOf(UntilCharTaker);
  });

  test('returns UntilRegexTaker', () => {
    expect(until(regex(/a/))).toBeInstanceOf(UntilRegexTaker);
  });

  test('returns UntilCharTaker', () => {
    expect(until(() => 0)).toBeInstanceOf(UntilTaker);
  });
});

describe('UntilCaseSensitiveTextTaker', () => {

  test('reads chars until substr is met', () => {
    expect(new UntilCaseSensitiveTextTaker('b', false, false, 0).take('aaabbb', 0)).toBe(3);
  });

  test('reads chars including substr', () => {
    expect(new UntilCaseSensitiveTextTaker('b', true, false, 0).take('aaabbb', 0)).toBe(4);
  });
});

describe('UntilCharTaker', () => {

  test('reads chars until char is met', () => {
    expect(new UntilCharTaker((charCode) => charCode === 'b'.charCodeAt(0), false, false, 0).take('aaabbb', 0)).toBe(3);
  });
});

describe('UntilRegexTaker', () => {

  test('reads until regex is met', () => {
    expect(new UntilRegexTaker(/b/, false, false, 0).take('aaabbbaaabbb', 0)).toBe(3);
    expect(new UntilRegexTaker(/b/, false, false, 0).take('aaabbbaaabbb', 6)).toBe(9);
    expect(new UntilRegexTaker(/c/, false, false, 0).take('aaabbbaaabbb', 6)).toBe(ResultCode.NO_MATCH);
  });

  test('reads chars including matched substr', () => {
    expect(new UntilRegexTaker(/bb/, true, false, 0).take('aaabbbb', 0)).toBe(5);
  });

  test('reads open-ended', () => {
    expect(new UntilRegexTaker(/c/, false, true, 0).take('aaabbb', 0)).toBe(6);
    expect(new UntilRegexTaker(/c/, false, true, 3).take('aaabbb', 0)).toBe(9);
  });
});

// describe('UntilTaker', () => {
//
//   test('', () => {
//   });
// });
