import {all, char, maybe, or, ResultCode, seq, text} from '../../main';

test('readme example', () => {

  const takeZero = text('0');

  const takeLeadingDigit = char([[49 /*1*/, 57 /*9*/]]);

  const takeDigits = all(char([[48 /*0*/, 57 /*9*/]]));
  // const takeDigits = all(char((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/));

  const takeDot = text('.');

  const takeSign = char([43 /*+*/, 45 /*-*/]);

  const takeNumber = seq(
      // sign
      maybe(takeSign),

      // integer
      or(
          takeZero,
          seq(
              takeLeadingDigit,
              takeDigits,
          ),
      ),

      // fraction
      maybe(
          seq(
              takeDot,
              takeDigits,
          ),
      ),
  );

  expect(takeNumber('', 0)).toBe(ResultCode.NO_MATCH);
  expect(takeNumber('0', 0)).toBe(1);

  expect(takeNumber('00', 0)).toBe(1);

  expect(takeNumber('123', 0)).toBe(3);

  expect(takeNumber('0.', 0)).toBe(2);
  expect(takeNumber('0.123', 0)).toBe(5);

  expect(takeNumber('-0.123', 0)).toBe(6);
  expect(takeNumber('+0.123', 0)).toBe(6);
});
