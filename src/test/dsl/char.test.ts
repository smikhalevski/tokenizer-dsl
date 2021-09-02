
const A = 'a'.charCodeAt(0);
const B = 'b'.charCodeAt(0);

describe('char', () => {

  it('types char code node', () => {
    const taker = char(A);

    expect((taker as INode)[NodeProperty.TYPE]).toBe(TakerType.CHAR_CASE_SENSITIVE);
    expect((taker as INode)[NodeProperty.VALUE]).toBe(A);
  });

  it('types char code checker node', () => {
    const charCodeChecker: CharCodeChecker = (charCode) => charCode === A;
    const taker = char(charCodeChecker);

    expect((taker as INode)[NodeProperty.TYPE]).toBe(TakerType.CHAR_CODE_CHECKER);
    expect((taker as INode)[NodeProperty.VALUE]).toBe(charCodeChecker);
  });

  it('reads char at offset', () => {
    expect(char(A)('aaabbb', 2)).toBe(3);
    expect(char(B)('aaabbb', 4)).toBe(5);
  });

  it('does not read unmatched char', () => {
    expect(char(A)('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(char(B)('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
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
