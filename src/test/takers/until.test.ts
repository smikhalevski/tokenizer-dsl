import {until} from '../../main/takers/until';
import {text} from '../../main/takers/text';
import {char} from '../../main/takers/char';
import {ResultCode} from '../../main';

describe('until', () => {

  test('reads chars until substr is met', () => {
    expect(until(text('b')).take('aaabbb', 0)).toBe(3);
  });

  test('reads chars until end of string if substr is not met', () => {
    expect(until(char(isNaN), {inclusive: true}).take('aaabbb', 0)).toBe(ResultCode.NO_MATCH);
  });

  test('reads chars including substr', () => {
    expect(until(text('b'), {inclusive: true}).take('aaabbb', 0)).toBe(4);
  });

  test('reads chars until substr is met', () => {
    expect(until(text('b')).take('aaabbb', 0)).toBe(3);
  });

  test('reads chars including substr', () => {
    expect(until(text('b'), {inclusive: true}).take('aaabbb', 0)).toBe(4);
  });
});
