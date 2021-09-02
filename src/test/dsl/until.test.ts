import {until} from '../../main/takers/until';
import {text} from '../../main/takers/text';
import {char} from '../../main/takers/char';
import {ResultCode} from '../../main';

describe('until', () => {

  it('reads chars until substr is met', () => {
    expect(until(text('b'))('aaabbb', 0)).toBe(3);
  });

  it('reads chars until end of string if substr is not met', () => {
    expect(until(char(isNaN), {inclusive: true})('aaabbb', 0)).toBe(ResultCode.NO_MATCH);
  });

  it('reads chars including substr', () => {
    expect(until(text('b'), {inclusive: true})('aaabbb', 0)).toBe(4);
  });

  it('reads chars until substr is met', () => {
    expect(until(text('b'))('aaabbb', 0)).toBe(3);
  });

  // it('reads chars until end of string if substr is not met', () => {
  //   expect(until(text('c', {openEnded: true}))('aaabbb', 0)).toBe(6);
  //   expect(until(text('c', {inclusive: true, openEnded: true})('aaabbb', 0)).toBe(7);
  // });

  it('reads chars including substr', () => {
    expect(until(text('b'), {inclusive: true})('aaabbb', 0)).toBe(4);
  });
});
