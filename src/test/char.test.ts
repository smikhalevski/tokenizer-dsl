import {char, ResultCode, TakerType} from '../main';
import {createCharTaker} from '../main/char';

const A = 'a'.charCodeAt(0);
const B = 'b'.charCodeAt(0);

describe('char', () => {

  test('returns CharTaker', () => {
    expect(char(() => false).__type).toBe(TakerType.CHAR);
  });
});

describe('createCharTaker', () => {

  test('takes char at offset', () => {
    expect(createCharTaker((charCode) => charCode === A)('aaabbb', 2)).toBe(3);
    expect(createCharTaker((charCode) => charCode === B)('aaabbb', 4)).toBe(5);
  });

  test('does not read unmatched char', () => {
    expect(createCharTaker((charCode) => charCode === A)('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(createCharTaker((charCode) => charCode === B)('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
  });
});