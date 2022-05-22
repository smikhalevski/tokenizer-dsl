import {regex, RegexReader, toReaderFunction} from '../../main/readers';

describe('regex', () => {

  test('returns RegexReader', () => {
    expect(regex(/abc/)).toBeInstanceOf(RegexReader);
  });
});

describe('RegexReader', () => {

  test('reads text', () => {
    const read = toReaderFunction(new RegexReader(/abc/y));

    expect(read('aaaabc', 3)).toBe(6);
    expect(read('aaaabcde', 3)).toBe(6);
    expect(read('aaaab', 3)).toBe(-1);
    expect(read('aaaABC', 3)).toBe(-1);
  });

  test('starts from the given offset', () => {
    expect(toReaderFunction(new RegexReader(/abc/y))('aaaabcabc', 6)).toBe(9);
  });

  test('ignores matches that do not start at offset', () => {
    expect(toReaderFunction(new RegexReader(/abc/y))('aaaabcabc', 5)).toBe(-1);
  });
});
