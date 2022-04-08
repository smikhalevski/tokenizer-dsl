import {InternalTaker, maybe, never, NO_MATCH, none, text} from '../../main';
import {createMaybeTaker} from '../../main/takers';

describe('maybe', () => {

  test('returns never', () => {
    expect(maybe(never)).toBe(never);
  });

  test('returns none', () => {
    expect(maybe(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect((maybe(() => 0) as InternalTaker).type).toBe(MAYBE_TYPE);
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
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(createMaybeTaker(takerMock)('aabbcc', 2)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  test('can use inline takers', () => {
    expect(createMaybeTaker(text('aa'))('aabbcc', 0)).toBe(2);
    expect(createMaybeTaker(text('bb'))('aabbcc', 0)).toBe(0);
  });

});
