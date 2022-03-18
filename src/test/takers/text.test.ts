import {text} from '../../main/takers/text';
import {noneTaker} from '../../main/taker-utils';
import {ResultCode} from '../../main/taker-types';

describe('text', () => {

  test('returns noneTaker for an empty string', () => {
    expect(text('')).toBe(noneTaker);
  });

  test('takes case-sensitive text', () => {
    const taker = text('abc');

    expect(taker.take('aaaabc', 3)).toBe(6);
    expect(taker.take('aaaabcde', 3)).toBe(6);
    expect(taker.take('aaaab', 3)).toBe(ResultCode.NO_MATCH);
    expect(taker.take('aaaABC', 3)).toBe(ResultCode.NO_MATCH);
  });

  test('takes case-insensitive text', () => {
    const taker = text('abc', {caseInsensitive: true});

    expect(taker.take('AAAABC', 3)).toBe(6);
    expect(taker.take('AAAABCDE', 3)).toBe(6);
    expect(taker.take('AAAAB', 3)).toBe(ResultCode.NO_MATCH);
  });

  test('does not take if substring is not matched', () => {
    expect(text('abc').take('aaaabd', 3)).toBe(ResultCode.NO_MATCH);
    expect(text('abc', {caseInsensitive: true}).take('AAAABDE', 3)).toBe(ResultCode.NO_MATCH);
  });
});
