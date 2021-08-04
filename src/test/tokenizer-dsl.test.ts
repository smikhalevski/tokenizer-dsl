import {all, allCharBy, char, charBy, maybe, or, ResultCode, seq, text, untilCharBy, untilText} from '../main';

const A = 'a'.charCodeAt(0);
const B = 'b'.charCodeAt(0);

describe('char', () => {

  it('reads char at offset', () => {
    expect(char(A)('aaabbb', 2)).toBe(3);
    expect(char(B)('aaabbb', 4)).toBe(5);
  });

  it('does not read unmatched char', () => {
    expect(char(A)('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(char(B)('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
  });
});

describe('charBy', () => {

  it('reads char at offset', () => {
    expect(charBy((charCode) => charCode === A)('aaabbb', 2)).toBe(3);
    expect(charBy((charCode) => charCode === B)('aaabbb', 4)).toBe(5);
  });

  it('does not read unmatched char', () => {
    expect(charBy((charCode) => charCode === A)('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(charBy((charCode) => charCode === B)('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
  });
});

describe('text', () => {

  it('reads case-sensitive substr at offset', () => {
    expect(text('ab')('aaabbb', 2)).toBe(4);
    expect(text('AB')('aaabbb', 2)).toBe(ResultCode.NO_MATCH);
    expect(text('bb')('aaabbb', 4)).toBe(6);
  });

  it('reads case-insensitive substr at offset', () => {
    expect(text('AB', {caseInsensitive: true})('aaabbb', 2)).toBe(4);
    expect(text('BB', {caseInsensitive: true})('aaabbb', 4)).toBe(6);
  });

  it('does not read if substring is not matched', () => {
    expect(text('aa')('aaabbb', 4)).toBe(ResultCode.NO_MATCH);
    expect(text('bb')('aaabbb', 5)).toBe(ResultCode.NO_MATCH);
  });
});

describe('untilText', () => {

  it('reads chars until substr is met', () => {
    expect(untilText('b')('aaabbb', 0)).toBe(3);
  });

  it('reads chars until end of string if substr is not met', () => {
    expect(untilText('c', {openEnded: true})('aaabbb', 0)).toBe(6);
    expect(untilText('c', {inclusive: true, openEnded: true})('aaabbb', 0)).toBe(7);
  });

  it('reads chars including substr', () => {
    expect(untilText('b', {inclusive: true})('aaabbb', 0)).toBe(4);
  });
});

describe('untilCharBy', () => {

  it('reads chars until substr is met', () => {
    expect(untilCharBy((charCode) => charCode === B)('aaabbb', 0)).toBe(3);
  });

  it('reads chars until end of string if substr is not met', () => {
    expect(untilCharBy(() => false, {openEnded: true})('aaabbb', 0)).toBe(6);
    expect(untilCharBy(() => false, {inclusive: true, openEnded: true})('aaabbb', 0)).toBe(7);
  });

  it('reads chars including substr', () => {
    expect(untilCharBy((charCode) => charCode === B, {inclusive: true})('aaabbb', 0)).toBe(4);
  });
});

describe('maybe', () => {

  it('returns result of taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);

    expect(maybe(takerMock)('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  it('returns offset if taker did not match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(maybe(takerMock)('aabbcc', 2)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });
});

describe('seq', () => {

  it('invokes takers sequentially', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock)('aabbcc', 2)).toBe(5);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('fails if any of takers fail', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock, takerMock)('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('allows takers to return the same offset', () => {
    expect(seq(() => 2, () => 4)('aabbcc', 2)).toBe(4);
  });

  it('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.ERROR);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock, takerMock)('aabbcc', 2)).toBe(ResultCode.ERROR);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});

describe('all', () => {

  it('reads chars until taker returns ResultCode.NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(all(takerMock)('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(3);
  });

  it('reads chars until taker returns the same offset', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock)('aabbcc', 2)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('reads error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(ResultCode.ERROR);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock)('aabbcc', 2)).toBe(ResultCode.ERROR);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('return ResultCode.NO_MATCH if minimum matches was not reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);

    expect(all(takerMock, {minimumCount: 2})('a', 0)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  it('return offset if minimum was reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock, {minimumCount: 2})('aaa', 0)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(3);
  });

  it('limits maximum read char count', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock, {maximumCount: 2})('aaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('maximum does not affect the minimum', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock, {maximumCount: 2})('a', 0)).toBe(1);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });
});

describe('allCharBy', () => {

  it('reads all matching chars', () => {
    expect(allCharBy((charCode) => charCode === A)('aabbcc', 0)).toBe(2);
  });

  it('returns current offset if no chars matched', () => {
    expect(allCharBy(() => false)('aabbcc', 2)).toBe(2);
  });

  it('limits minimum read char count', () => {
    expect(allCharBy(() => true, {minimumCount: 2})('aaa', 0)).toBe(3);
    expect(allCharBy(() => true, {minimumCount: 2})('a', 0)).toBe(ResultCode.NO_MATCH);
  });

  it('limits maximum read char count', () => {
    expect(allCharBy(() => true, {maximumCount: 2})('a', 0)).toBe(1);
    expect(allCharBy(() => true, {maximumCount: 2})('aaa', 0)).toBe(2);
  });
});

describe('or', () => {

  it('returns after the first match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(4);

    expect(or(takerMock, takerMock, takerMock)('aabbcc', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('returns ResultCode.NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValue(ResultCode.NO_MATCH);

    expect(or(takerMock, takerMock)('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(ResultCode.ERROR);
    takerMock.mockReturnValueOnce(4);

    expect(or(takerMock, takerMock)('aabbcc', 2)).toBe(ResultCode.ERROR);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});

describe('docs', () => {

  it('readme example', () => {

    const takeZero = char(48 /*0*/);

    const takeLeadingDigit = charBy((charCode) => charCode >= 49 /*1*/ || charCode <= 57 /*9*/);

    const takeDigits = allCharBy((charCode) => charCode >= 48 /*0*/ || charCode <= 57 /*9*/);

    const takeDot = char(46 /*.*/);

    const takeSign = charBy((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

    const takeNumber = seq(
        // sign
        maybe(takeSign),

        // integer
        or(
            takeZero,
            seq(
                takeLeadingDigit,
                takeDigits,
            ),
        ),

        // fraction
        maybe(
            seq(
                takeDot,
                maybe(takeDigits),
            ),
        ),
    );

    expect(takeNumber('', 0)).toBe(-1);
    expect(takeNumber('0', 0)).toBe(1);

    expect(takeNumber('00', 0)).toBe(1);

    expect(takeNumber('123', 0)).toBe(3);

    expect(takeNumber('0.', 0)).toBe(2);
    expect(takeNumber('0.123', 0)).toBe(5);

    expect(takeNumber('-0.123', 0)).toBe(6);
    expect(takeNumber('+0.123', 0)).toBe(6);
  });
});
