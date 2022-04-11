import {maybe, never, NO_MATCH, none, text} from '../../main';
import {toTakerFunction} from '../../main/rules';
import {MaybeTaker} from '../../main/takers';

describe('maybe', () => {

  test('returns none', () => {
    expect(maybe(never)).toBe(none);
    expect(maybe(none)).toBe(none);
  });

  test('returns MaybeTaker', () => {
    expect(maybe(() => 0)).toBeInstanceOf(MaybeTaker);
  });
});

describe('MaybeTaker', () => {

  test('returns result of taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(4);

    expect(toTakerFunction(new MaybeTaker(takerMock))('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  test('returns offset if taker did not match', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(NO_MATCH);

    expect(toTakerFunction(new MaybeTaker(takerMock))('aabbcc', 2)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(1);
  });

  test('can use inline takers', () => {
    expect(toTakerFunction(new MaybeTaker(text('aa')))('aabbcc', 0)).toBe(2);
    expect(toTakerFunction(new MaybeTaker(text('bb')))('aabbcc', 0)).toBe(0);
  });

});
