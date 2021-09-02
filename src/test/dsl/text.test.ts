import {text} from '../../main/takers/text';
import {takeNone} from '../../main/taker-utils';
import {TakerType} from '../../main';

describe('text', () => {

  test('returns char for a single char string', () => {
    const taker = text('a');

    expect(taker.type).toBe(TakerType.CHAR_CASE_SENSITIVE);
  });

  test('returns takeNone for an empty string', () => {
    expect(text('')).toBe(takeNone);
  });

  test('takes case-sensitive text', () => {
    const taker = text('abc');

    expect((taker as INode)[NodeProperty.TYPE]).toBe(TakerType.TEXT_CASE_SENSITIVE);
    expect((taker as INode)[NodeProperty.VALUE]).toBe('abc');

    expect(taker('aaaabc', 3)).toBe(6);
    expect(taker('aaaabcde', 3)).toBe(6);
    expect(taker('aaaab', 3)).toBe(-1);
    expect(taker('aaaABC', 3)).toBe(-1);
  });

  test('takes case-insensitive text', () => {
    const taker = text('abc', {caseSensitive: false});

    expect((taker as INode)[NodeProperty.TYPE]).toBe(TakerType.TEXT_CASE_INSENSITIVE);
    expect((taker as INode)[NodeProperty.VALUE]).toBe('abc');

    expect(taker('AAAABC', 3)).toBe(6);
    expect(taker('AAAABCDE', 3)).toBe(6);
    expect(taker('AAAAB', 3)).toBe(-1);
  });

  test('does not take if substring is not matched', () => {
    expect(text('abc')('aaaabd', 3)).toBe(-1);
    expect(text('abc', {caseSensitive: false})('AAAABDE', 3)).toBe(-1);
  });
});
