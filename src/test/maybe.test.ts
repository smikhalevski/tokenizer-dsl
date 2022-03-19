import {maybe, never, none, ResultCode, TakerType} from '../main';
import {createMaybeTaker} from '../main/maybe';

describe('maybe', () => {

  test('returns never', () => {
    expect(maybe(never)).toBe(never);
  });

  test('returns none', () => {
    expect(maybe(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect(maybe(() => 0).__type).toBe(TakerType.MAYBE);
  });
});

describe('createMaybeTaker', () => {

  test('returns result of taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);

    expect(createMaybeTaker(takerMock)('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  test('returns offset if taker did not match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(createMaybeTaker(takerMock)('aabbcc', 2)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });
});
