import {seq} from '../../main/dsl/seq';
import {NO_MATCH} from '../../main/types';

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
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock, takerMock)('aabbcc', 2)).toBe(NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('allows takers to return the same offset', () => {
    expect(seq(() => 2, () => 4)('aabbcc', 2)).toBe(4);
  });

  it('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(5);

    expect(seq(takerMock, takerMock, takerMock)('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});
