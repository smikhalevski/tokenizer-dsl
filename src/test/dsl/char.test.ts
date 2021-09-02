import {CharCodeChecker, ResultCode, TakerType} from '../../main/taker-types';
import {char} from '../../main/takers/char';

const A = 'a'.charCodeAt(0);
const B = 'b'.charCodeAt(0);

describe('char', () => {

  it('types char code checker node', () => {
    const charCodeChecker: CharCodeChecker = (charCode) => charCode === A;
    const taker = char(charCodeChecker);

    expect(taker.type).toBe(TakerType.CHAR);
    expect(taker.data).toBe(charCodeChecker);
  });

  it('reads char at offset', () => {
    expect(char((charCode) => charCode === A)('aaabbb', 2)).toBe(3);
    expect(char((charCode) => charCode === B)('aaabbb', 4)).toBe(5);
  });

  it('does not read unmatched char', () => {
    expect(char((charCode) => charCode === A)('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(char((charCode) => charCode === B)('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
  });
});
