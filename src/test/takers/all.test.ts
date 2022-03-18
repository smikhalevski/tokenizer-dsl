import {all, char, never, none, ResultCode, Taker, text} from '../../main';
import {AllCaseSensitiveTextTaker, AllCharTaker, AllTaker} from '../../main/takers/all';
import {MaybeTaker} from '../../main/takers/maybe';

describe('all', () => {

  test('returns never', () => {
    expect(all(() => 0, {maximumCount: -1})).toBe(never);
    expect(all(never)).toBe(never);
  });

  test('returns none', () => {
    expect(all(() => 0, {maximumCount: 0})).toBe(none);
    expect(all(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect(all(() => 0, {maximumCount: 1})).toBeInstanceOf(MaybeTaker);
  });

  test('returns taker', () => {
    const takerMock: Taker = {take: () => 0};
    expect(all(takerMock, {minimumCount: 1, maximumCount: 1})).toBe(takerMock);
  });

  test('returns AllCharTaker', () => {
    expect(all(char(() => false))).toBeInstanceOf(AllCharTaker);
  });

  test('returns AllCaseSensitiveTextTaker', () => {
    expect(all(text('a'))).toBeInstanceOf(AllCaseSensitiveTextTaker);
    expect(all(text('aaa'))).toBeInstanceOf(AllCaseSensitiveTextTaker);
  });

  test('returns AllTaker', () => {
    expect(all(() => 0)).toBeInstanceOf(AllTaker);
  });
});

describe('AllCharTaker', () => {

  test('takes sequential chars', () => {
    expect(new AllCharTaker(() => true, 0, Infinity).take('aaabbbccc', 2)).toBe(9);
    expect(new AllCharTaker(() => false, 1, Infinity).take('aaabbbccc', 2)).toBe(ResultCode.NO_MATCH);
  });
});

describe('AllCaseSensitiveTextTaker', () => {

  test('takes sequential case-insensitive substrings', () => {
    expect(new AllCaseSensitiveTextTaker('abc', 0, Infinity).take('abcabcabcd', 3)).toBe(9);
    expect(new AllCaseSensitiveTextTaker('abc', 3, Infinity).take('abcabcabcd', 3)).toBe(ResultCode.NO_MATCH);
  });
});

describe('AllTaker', () => {

  test('takes until taker returns ResultCode.NO_MATCH', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(3);
    takeMock.mockReturnValueOnce(4);
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(new AllTaker({take: takeMock}, 0, Infinity).take('aabbcc', 2)).toBe(4);
    expect(takeMock).toHaveBeenCalledTimes(3);
  });

  test('takes until taker returns the same offset', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(3);
    takeMock.mockReturnValueOnce(3);

    expect(new AllTaker({take: takeMock}, 0, Infinity).take('aabbcc', 2)).toBe(3);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying taker', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(3);
    takeMock.mockReturnValueOnce(-2);
    takeMock.mockReturnValueOnce(3);

    expect(new AllTaker({take: takeMock}, 0, Infinity).take('aabbcc', 2)).toBe(-2);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('returns ResultCode.NO_MATCH if minimum matches was not reached', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(1);
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(new AllTaker({take: takeMock}, 2, Infinity).take('a', 0)).toBe(ResultCode.NO_MATCH);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(1);
    takeMock.mockReturnValueOnce(2);
    takeMock.mockReturnValueOnce(3);
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(new AllTaker({take: takeMock}, 2, Infinity).take('aaa', 0)).toBe(3);
    expect(takeMock).toHaveBeenCalledTimes(4);
  });

  test('limits maximum read char count', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(1);
    takeMock.mockReturnValueOnce(2);
    takeMock.mockReturnValueOnce(3);

    expect(new AllTaker({take: takeMock}, 0, 2).take('aaa', 0)).toBe(2);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('maximum does not affect the minimum', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(1);
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(new AllTaker({take: takeMock}, 0, 2).take('a', 0)).toBe(1);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });
});
