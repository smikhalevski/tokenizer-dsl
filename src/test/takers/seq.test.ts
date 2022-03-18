import {seq} from '../../main/takers/seq';
import {ResultCode} from '../../main/taker-types';

describe('seq', () => {

  test('fails if any of takers fail', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock, takerMock).take('aabbcc', 2)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('allows takers to return the same offset', () => {
    expect(seq(() => 2, () => 4).take('aabbcc', 2)).toBe(4);
  });

  test('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock, takerMock).take('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});
