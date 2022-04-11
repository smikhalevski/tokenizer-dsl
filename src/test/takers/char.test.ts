import {char, CharCodeRangeTaker, NO_MATCH, none, toTakerFunction} from '../../main/takers';

const A = 'a'.charCodeAt(0);

describe('char', () => {

  test('returns none', () => {
    expect(char([])).toBe(none);
    expect(char([''])).toBe(none);
  });

  test('returns CharCodeRangeTaker', () => {
    expect(char([0])).toBeInstanceOf(CharCodeRangeTaker);
  });
});


describe('CharCodeRangeTaker', () => {

  test('takes exact char at offset', () => {
    expect(toTakerFunction(new CharCodeRangeTaker([A]))('aaabbb', 2)).toBe(3);
  });

  test('takes char code range at offset', () => {
    expect(toTakerFunction(new CharCodeRangeTaker([[A - 1, A + 1]]))('aaabbb', 2)).toBe(3);
  });

  test('does not read unmatched char', () => {
    expect(toTakerFunction(new CharCodeRangeTaker([A]))('aaabbb', 4)).toBe(NO_MATCH);
  });
});
