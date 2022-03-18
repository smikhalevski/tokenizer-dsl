import {none, or, ResultCode} from '../../main';
import {OrTaker} from '../../main/takers/or';

describe('or', () => {

  test('returns none taker', () => {
    expect(or()).toBe(none);
  });

  test('returns single taker', () => {
    const takerMock = {take: () => 0};
    expect(or(takerMock)).toBe(takerMock);
  });

  test('returns OrTaker', () => {
    const takerMock = jest.fn();
    expect(or(takerMock, takerMock)).toBeInstanceOf(OrTaker);
  });
});

describe('OrTaker', () => {

  test('returns after the first match', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takeMock.mockReturnValueOnce(2);
    takeMock.mockReturnValueOnce(4);

    expect(new OrTaker([{take: takeMock}, {take: takeMock}, {take: takeMock}]).take('aabbcc', 0)).toBe(2);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('returns ResultCode.NO_MATCH', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValue(ResultCode.NO_MATCH);

    expect(new OrTaker([{take: takeMock}, {take: takeMock}]).take('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takeMock.mockReturnValueOnce(-2);
    takeMock.mockReturnValueOnce(4);

    expect(new OrTaker([{take: takeMock}, {take: takeMock}]).take('aabbcc', 2)).toBe(-2);
    expect(takeMock).toHaveBeenCalledTimes(2);
  });
});
