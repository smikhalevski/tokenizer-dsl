import {until} from '../../main/dsl/until';
import {text} from '../../main/dsl/text';
import {char} from '../../main/dsl/char';
import {NO_MATCH} from '../../main';

describe('until', () => {

  it('reads chars until substr is met', () => {
    expect(until(text('b'))('aaabbb', 0)).toBe(3);
  });

  it('reads chars until end of string if substr is not met', () => {
    expect(until(char(isNaN), {inclusive: true})('aaabbb', 0)).toBe(NO_MATCH);
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