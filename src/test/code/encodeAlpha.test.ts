import {encodeAlpha} from '../../main/code';

describe('encodeAlpha', () => {

  test('encodes numbers as latin letters', () => {
    expect(encodeAlpha(0)).toBe('a');
    expect(encodeAlpha(25)).toBe('z');

    expect(encodeAlpha(26)).toBe('aa');
    expect(encodeAlpha(51)).toBe('az');

    expect(encodeAlpha(52)).toBe('ba');
    expect(encodeAlpha(Number.MAX_SAFE_INTEGER)).toBe('bktxhsoghkkf');
  });

  test('encodes floating numbers', () => {
    expect(encodeAlpha(10.7)).toBe('k');
  });
});
