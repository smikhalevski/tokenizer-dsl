import {all, char, maybe, NO_MATCH, or, seq, text, toTakerFunction} from '../../main/takers';

test('readme example', () => {

  const zeroTaker = text('0');

  const leadingDigitTaker = char([[49 /*1*/, 57 /*9*/]]);

  const digitsTaker = all(char([[48 /*0*/, 57 /*9*/]]));

  const dotTaker = text('.');

  const signTaker = char(['+-']);

  const numberTaker = seq(
      // sign
      maybe(signTaker),

      // integer
      or(
          zeroTaker,
          seq(
              leadingDigitTaker,
              digitsTaker,
          ),
      ),

      // fraction
      maybe(
          seq(
              dotTaker,
              digitsTaker,
          ),
      ),
  );

  const takeNumber = toTakerFunction<void>(numberTaker);

  expect(takeNumber('', 0)).toBe(NO_MATCH);
  expect(takeNumber('0', 0)).toBe(1);

  expect(takeNumber('00', 0)).toBe(1);

  expect(takeNumber('123', 0)).toBe(3);

  expect(takeNumber('0.', 0)).toBe(2);
  expect(takeNumber('0.123', 0)).toBe(5);

  expect(takeNumber('-0.123', 0)).toBe(6);
  expect(takeNumber('+0.123', 0)).toBe(6);
});
