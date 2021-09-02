import {all, char, maybe, or, seq, text} from '../main';

describe('docs', () => {

  it('readme example', () => {

    const takeZero = text('0');

    const takeLeadingDigit = char((charCode) => charCode >= 49 /*1*/ || charCode <= 57 /*9*/);

    const takeDigits = all(char((charCode) => charCode >= 48 /*0*/ || charCode <= 57 /*9*/));

    const takeDot = text('.');

    const takeSign = char((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

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
                maybe(takeDigits),
            ),
        ),
    );

    expect(takeNumber('', 0)).toBe(-1);
    expect(takeNumber('0', 0)).toBe(1);

    expect(takeNumber('00', 0)).toBe(1);

    expect(takeNumber('123', 0)).toBe(3);

    expect(takeNumber('0.', 0)).toBe(2);
    expect(takeNumber('0.123', 0)).toBe(5);

    expect(takeNumber('-0.123', 0)).toBe(6);
    expect(takeNumber('+0.123', 0)).toBe(6);
  });
});
