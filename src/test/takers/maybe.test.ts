import {maybe, never, none, ResultCode} from '../../main';
import {MaybeTaker} from '../../main/takers/maybe';

describe('maybe', () => {

  test('returns never', () => {
    expect(maybe(never)).toBe(never);
  });

  test('returns none', () => {
    expect(maybe(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect(maybe(() => 0)).toBeInstanceOf(MaybeTaker);
  });
});

describe('MaybeTaker', () => {

  test('returns result of taker', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(4);

    expect(new MaybeTaker({take: takeMock}).take('aabbcc', 2)).toBe(4);
    expect(takeMock).toHaveBeenCalledTimes(1);
  });

  test('returns offset if taker did not match', () => {
    const takeMock = jest.fn();
    takeMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(new MaybeTaker({take: takeMock}).take('aabbcc', 2)).toBe(2);
    expect(takeMock).toHaveBeenCalledTimes(1);
  });
});
