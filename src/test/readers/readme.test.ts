import {all, char, maybe, NO_MATCH, or, seq, text, toReaderFunction} from '../../main/readers';

test('readme example', () => {

  const zeroReader = text('0');

  const leadingDigitReader = char([[49 /*1*/, 57 /*9*/]]);

  const digitsReader = all(char([[48 /*0*/, 57 /*9*/]]));

  const dotReader = text('.');

  const signReader = char(['+-']);

  const numberReader = seq(
      // sign
      maybe(signReader),

      // integer
      or(
          zeroReader,
          seq(
              leadingDigitReader,
              digitsReader,
          ),
      ),

      // fraction
      maybe(
          seq(
              dotReader,
              digitsReader,
          ),
      ),
  );

  const readNumber = toReaderFunction<void>(numberReader);

  expect(readNumber('', 0)).toBe(NO_MATCH);
  expect(readNumber('0', 0)).toBe(1);

  expect(readNumber('00', 0)).toBe(1);

  expect(readNumber('123', 0)).toBe(3);

  expect(readNumber('0.', 0)).toBe(2);
  expect(readNumber('0.123', 0)).toBe(5);

  expect(readNumber('-0.123', 0)).toBe(6);
  expect(readNumber('+0.123', 0)).toBe(6);
});
