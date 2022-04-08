import {InternalTaker, NO_MATCH, none, or, TakerFunction, text} from '../../main';
import {createOrTaker} from '../../main/takers';

describe('or', () => {

  test('returns none taker', () => {
    expect(or()).toBe(none);
  });

  test('returns single taker', () => {
    const takerMock: TakerFunction = () => 0;
    expect(or(takerMock)).toBe(takerMock);
  });

  test('returns OrTaker', () => {
    const takerMock = jest.fn();
    expect((or(takerMock, takerMock) as InternalTaker).type).toBe(OR_TYPE);
  });
});

describe('createOrTaker', () => {

  test('returns after the first match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(4);

    expect(createOrTaker([takerMock, takerMock, takerMock])('aabbcc', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValue(NO_MATCH);

    expect(createOrTaker([takerMock, takerMock])('aabbcc', 2)).toBe(NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(4);

    expect(createOrTaker([takerMock, takerMock])('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('can use inline takers', () => {
    expect(createOrTaker([text('bb'), text('aa')])('aabbcc', 0)).toBe(2);
  });
});
