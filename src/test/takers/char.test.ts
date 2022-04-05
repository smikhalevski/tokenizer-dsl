import {char, InternalTaker, InternalTakerType, none, ResultCode} from '../../main';
import {createCharCodeCheckerTaker, createCharCodeRangeTaker} from '../../main/takers';

const A = 'a'.charCodeAt(0);
const B = 'b'.charCodeAt(0);

describe('char', () => {

  test('returns none', () => {
    expect(char([])).toBe(none);
  });

  test('returns CharCodeCheckerTaker', () => {
    expect((char(() => false) as InternalTaker).type).toBe(InternalTakerType.CHAR_CODE_CHECKER);
  });

  test('returns CharCodeRangeTaker', () => {
    expect((char([0]) as InternalTaker).type).toBe(InternalTakerType.CHAR_CODE_RANGE);
  });
});

describe('createCharCodeCheckerTaker', () => {

  test('takes char at offset', () => {
    expect(createCharCodeCheckerTaker((charCode) => charCode === A)('aaabbb', 2)).toBe(3);
    expect(createCharCodeCheckerTaker((charCode) => charCode === B)('aaabbb', 4)).toBe(5);
  });

  test('does not read unmatched char', () => {
    expect(createCharCodeCheckerTaker((charCode) => charCode === A)('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(createCharCodeCheckerTaker((charCode) => charCode === B)('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
  });
});

describe('createCharCodeRangeTaker', () => {

  test('takes exact char at offset', () => {
    expect(createCharCodeRangeTaker([A])('aaabbb', 2)).toBe(3);
  });

  test('takes char code range at offset', () => {
    expect(createCharCodeRangeTaker([[A - 1, A + 1]])('aaabbb', 2)).toBe(3);
  });

  test('does not read unmatched char', () => {
    expect(createCharCodeRangeTaker([A])('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
  });
});
