import {none, or, OrTaker, ResultCode} from '../../main';

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
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(4);

    expect(or(takerMock, takerMock, takerMock).take('aabbcc', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns ResultCode.NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValue(ResultCode.NO_MATCH);

    expect(or(takerMock, takerMock).take('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(4);

    expect(or(takerMock, takerMock).take('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});
