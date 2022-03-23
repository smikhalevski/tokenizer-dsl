import {encodeLowerAlpha, flatCode} from '../main/js';

describe('encodeLowerAlpha', () => {

  test('encodes numbers as latin letters', () => {
    expect(encodeLowerAlpha(0)).toBe('a');
    expect(encodeLowerAlpha(25)).toBe('z');

    expect(encodeLowerAlpha(26)).toBe('aa');
    expect(encodeLowerAlpha(51)).toBe('az');

    expect(encodeLowerAlpha(52)).toBe('ba');
    expect(encodeLowerAlpha(100)).toBe('cw');
  });

  test('encodes floating numbers', () => {
    expect(encodeLowerAlpha(10.7)).toBe('k');
  });
});

describe('flatCode', () => {

  test('returns array as is', () => {
    const arr = ['a', 'b', 'c'];

    expect(flatCode(arr)).toBe(arr);
  });

  test('flattens nested arrays', () => {
    const arr = ['a', ['b', 'c'], 'e'];

    expect(flatCode(arr)).not.toBe(arr);
    expect(flatCode(arr)).toEqual(['a', 'b', 'c', 'e']);
  });
});