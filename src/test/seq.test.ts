import {InternalTaker, InternalTakerType, never, none, ResultCode, Taker, text} from '../main';
import {createSeqTaker, seq} from '../main/seq';

describe('seq', () => {

  test('returns none', () => {
    expect(seq()).toBe(none);
  });

  test('returns never', () => {
    expect(seq(never)).toBe(never);
    expect(seq(text('a'), never)).toBe(never);
  });

  test('returns taker', () => {
    const takerMock: Taker = () => 0;
    expect(seq(takerMock)).toBe(takerMock);
  });

  test('returns SeqTaker', () => {
    expect((seq(text('aaa'), text('bbb')) as InternalTaker).type).toBe(InternalTakerType.SEQ);
  });
});

describe('createSeqTaker', () => {

  test('fails if any of takers fail', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(5);

    expect(createSeqTaker([takerMock, takerMock, takerMock])('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('allows takers to return the same offset', () => {
    expect(createSeqTaker([() => 2, () => 4])('aabbcc', 2)).toBe(4);
  });

  test('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(5);

    expect(createSeqTaker([takerMock, takerMock, takerMock])('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline takers', () => {
    expect(createSeqTaker([text('aa'), text('bb')])('aabbcc', 0)).toBe(4);
  });
});
