import {until, UntilCaseSensitiveTextTaker, UntilCharTaker, UntilTaker} from '../../main/takers/until';
import {char, never, none, text} from '../../main';

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

// describe('UntilCharTaker', () => {
//
//   test('reads chars until end of string if substr is not met', () => {
//     expect(new UntilCharTaker().take('aaabbb', 0)).toBe(ResultCode.NO_MATCH);
//   });
// });

// describe('UntilTaker', () => {
//
//   test('', () => {
//   });
// });
