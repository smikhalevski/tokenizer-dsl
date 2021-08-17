import {or} from '../../main/dsl/or';
import {NO_MATCH} from '../../main/types';

describe('or', () => {

  it('returns after the first match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(4);

    expect(or(takerMock, takerMock, takerMock)('aabbcc', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('returns NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValue(NO_MATCH);

    expect(or(takerMock, takerMock)('aabbcc', 2)).toBe(NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  it('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(4);

    expect(or(takerMock, takerMock)('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});
