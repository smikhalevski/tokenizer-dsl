import {all} from '../../main/takers/all';
import {ResultCode} from '../../main/taker-types';
import {text} from '../../main';

describe('AllTaker', () => {

  test('takes until taker returns ResultCode.NO_MATCH', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(4);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(all(takerMock).take('aabbcc', 2)).toBe(4);
    expect(takerMock).toHaveBeenCalledTimes(3);
  });

  test('takes until taker returns the same offset', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock).take('aabbcc', 2)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns error result from underlying taker', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(-2);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock).take('aabbcc', 2)).toBe(-2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns ResultCode.NO_MATCH if minimum matches was not reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(all(takerMock, {minimumCount: 2}).take('a', 0)).toBe(ResultCode.NO_MATCH);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('returns offset if minimum was reached', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(all(takerMock, {minimumCount: 2}).take('aaa', 0)).toBe(3);
    expect(takerMock).toHaveBeenCalledTimes(4);
  });

  test('limits maximum read char count', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(2);
    takerMock.mockReturnValueOnce(3);

    expect(all(takerMock, {maximumCount: 2}).take('aaa', 0)).toBe(2);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });

  test('maximum does not affect the minimum', () => {
    const takerMock = jest.fn();
    takerMock.mockReturnValueOnce(1);
    takerMock.mockReturnValueOnce(ResultCode.NO_MATCH);

    expect(all(takerMock, {maximumCount: 2}).take('a', 0)).toBe(1);
    expect(takerMock).toHaveBeenCalledTimes(2);
  });
});

describe('AllCaseSensitiveTextTaker', () => {

  test('takes sequential strings', () => {
    expect(all(text('foo')).take('__foofoofoof', 2)).toBe(11);
    expect(all(text('foo'), {minimumCount: 1}).take('__foofoofoof', 2)).toBe(11);
    expect(all(text('foo'), {minimumCount: 4}).take('__foofoofoof', 2)).toBe(ResultCode.NO_MATCH);
    expect(all(text('foo'), {maximumCount: 2}).take('__foofoofoof', 2)).toBe(8);
  });
});
