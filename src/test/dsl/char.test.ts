import {ResultCode} from '../../main/taker-types';
import {char} from '../../main/takers/char';

const A = 'a'.charCodeAt(0);
const B = 'b'.charCodeAt(0);

describe('char', () => {

  it('reads char at offset', () => {
    expect(char((charCode) => charCode === A).take('aaabbb', 2)).toBe(3);
    expect(char((charCode) => charCode === B).take('aaabbb', 4)).toBe(5);
  });

  it('does not read unmatched char', () => {
    expect(char((charCode) => charCode === A).take('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(char((charCode) => charCode === B).take('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
  });
});
