import {maybe, MaybeTaker, ResultCode} from '../../main';

describe('maybe', () => {

  test('returns MaybeTaker', () => {
    expect(maybe(() => 0)).toBeInstanceOf(MaybeTaker);
  });
});

describe('MaybeTaker', () => {

  test('returns result of taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);

    expect(maybe(takerMock).take('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  test('returns offset if taker did not match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(maybe(takerMock).take('aabbcc', 2)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });
});
