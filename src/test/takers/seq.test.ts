import {seq, SeqTaker} from '../../main/takers/seq';
import {never, none, ResultCode, Taker, text} from '../../main';

describe('seq', () => {

  test('returns none', () => {
    expect(seq()).toBe(none);
  });

  test('returns never', () => {
    expect(seq(never)).toBe(never);
    expect(seq(text('a'), never)).toBe(never);
  });

  test('returns taker', () => {
    const takerMock: Taker = {take: () => 0};
    expect(seq(takerMock)).toBe(takerMock);
  });

  test('returns SeqTaker', () => {
    expect(seq(text('aaa'), text('bbb'))).toBeInstanceOf(SeqTaker);
  });
});

describe('SeqTaker', () => {

  test('fails if any of takers fail', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(4);
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takeMock.mockReturnValueOnce(5);

    expect(new SeqTaker([{take: takeMock}, {take: takeMock}, {take: takeMock}]).take('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('allows takers to return the same offset', () => {
    expect(seq(() => 2, () => 4).take('aabbcc', 2)).toBe(4);
  });

  test('returns error result', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(4);
    takeMock.mockReturnValueOnce(-2);
    takeMock.mockReturnValueOnce(5);

    expect(new SeqTaker([{take: takeMock}, {take: takeMock}, {take: takeMock}]).take('aabbcc', 2)).toBe(-2);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });
});
