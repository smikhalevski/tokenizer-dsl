import {char, CharCodeRangeReader, none, toReaderFunction} from '../../main/readers';

const A = 'a'.charCodeAt(0);

describe('char', () => {

  test('returns none', () => {
    expect(char([])).toBe(none);
    expect(char([''])).toBe(none);
  });

  test('returns CharCodeRangeReader', () => {
    expect(char([0])).toBeInstanceOf(CharCodeRangeReader);
  });
});


describe('CharCodeRangeReader', () => {

  test('reads exact char at offset', () => {
    expect(toReaderFunction(new CharCodeRangeReader([A]))('aaabbb', 2)).toBe(3);
  });

  test('reads char code range at offset', () => {
    expect(toReaderFunction(new CharCodeRangeReader([[A - 1, A + 1]]))('aaabbb', 2)).toBe(3);
  });

  test('does not read unmatched char', () => {
    expect(toReaderFunction(new CharCodeRangeReader([A]))('aaabbb', 4)).toBe(-1);
  });
});
