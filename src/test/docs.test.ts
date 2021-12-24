import {all, char, maybe, or, seq, text} from '../main';

describe('docs', () => {

  it('readme example', () => {

    const zeroTaker = text('0');

    const leadingDigitTaker = char((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

    const digitsTaker = all(char((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/));

    const dotTaker = text('.');

    const signTaker = char((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

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

    expect(numberTaker.take('', 0)).toBe(-1);
    expect(numberTaker.take('0', 0)).toBe(1);

    expect(numberTaker.take('00', 0)).toBe(1);

    expect(numberTaker.take('123', 0)).toBe(3);

    expect(numberTaker.take('0.', 0)).toBe(2);
    expect(numberTaker.take('0.123', 0)).toBe(5);

    expect(numberTaker.take('-0.123', 0)).toBe(6);
    expect(numberTaker.take('+0.123', 0)).toBe(6);
  });
});
