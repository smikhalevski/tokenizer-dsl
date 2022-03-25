const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

describe('readme', () => {

  const input = '-123.123aaaaa';

  test('RegExp', (measure) => {
    const re = /^[+-]?(?:0|[1-9])\d*(?:\.\d+)?/;
    measure(() => re.exec(input));
  });

  test('latest', (measure) => {

    const takeZero = latest.char('0'.charCodeAt(0));

    const takeLeadingDigit = latest.charBy((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

    const takeDigits = latest.allCharBy((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/);

    const takeDot = latest.char('.'.charCodeAt(0));

    const takeSign = latest.charBy((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

    const takeNumber = latest.seq(
        // sign
        latest.maybe(takeSign),

        // integer
        latest.or(
            takeZero,
            latest.seq(
                takeLeadingDigit,
                takeDigits,
            ),
        ),

        // fraction
        latest.maybe(
            latest.seq(
                takeDot,
                takeDigits,
            ),
        ),
    );

    measure(() => takeNumber(input, 0));
  });

  test('next', (measure) => {
    const takeZero = next.text('0');

    const takeLeadingDigit = next.char([[49 /*1*/, 57 /*9*/]]);

    const takeDigits = next.all(next.char([[48 /*0*/, 57 /*9*/]]));

    const takeDot = next.text('.');

    const takeSign = next.char([43 /*+*/, 45 /*-*/]);

    const takeNumber = next.seq(
        // sign
        next.maybe(takeSign),

        // integer
        next.or(
            takeZero,
            next.seq(
                takeLeadingDigit,
                takeDigits,
            ),
        ),

        // fraction
        next.maybe(
            next.seq(
                takeDot,
                takeDigits,
            ),
        ),
    );

    measure(() => takeNumber(input, 0));
  });
}, {targetRme: 0.001});

describe('char', () => {

  describe('CharCodeCheckerTaker', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^a/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.charBy((charCode) => charCode === 97);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.char((charCode) => charCode === 97);
      measure(() => take(input, 0));
    });
  });

  describe('CharCodeRangeTaker', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^[ab]/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.charBy((charCode) => charCode === 97 || charCode === 98);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.char([97, 98]);
      measure(() => take(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('all', () => {

  describe('AllCharCodeCheckerTaker', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^a*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.allCharBy((charCode) => charCode === 97);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.all(next.char((charCode) => charCode === 97));
      measure(() => take(input, 0));
    });
  });

  describe('AllCharCodeRangeTaker', () => {

    const input = 'abababc';

    test('RegExp', (measure) => {
      const re = /^[ab]*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.allCharBy((charCode) => charCode === 97 || charCode === 98);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.all(next.char([97, 98]));
      measure(() => take(input, 0));
    });
  });

  describe('AllCaseSensitiveTextTaker', () => {

    const input = 'ababababc';

    test('RegExp', (measure) => {
      const re = /^(?:ab)*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.all(latest.text('ab'));
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.all(next.text('ab'));
      measure(() => take(input, 0));
    });
  });

  describe('AllRegexTaker', () => {

    const input = 'ababababc';

    test('RegExp', (measure) => {
      const re = /^(?:ab)*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.all(latest.text('ab'));
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.all(next.regex(/ab/));
      measure(() => take(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('or', () => {

  describe('OrTaker', () => {

    const input = 'aaaa';

    test('RegExp', (measure) => {
      const re = /^[cba]/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.or(latest.char(99), latest.char(98), latest.char(97));
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.or(next.text('c'), next.text('b'), next.text('a'));
      measure(() => take(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('seq', () => {

  describe('SeqTaker', () => {

    const input = 'aaaa';

    test('RegExp', (measure) => {
      const re = /^aaa/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.seq(latest.char(97), latest.char(97), latest.char(97));
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.seq(next.text('a'), next.text('a'), next.text('a'));
      measure(() => take(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('text', () => {

  describe('CaseSensitiveTextTaker', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^ababa/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.text('ababa');
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.text('ababa');
      measure(() => take(input, 0));
    });
  });

  describe('CaseInsensitiveTextTaker', () => {

    const input = 'aBAbab';

    test('RegExp', (measure) => {
      const re = /^ABABA/i;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.text('ABABA', true);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.text('ABABA', {caseInsensitive: true});
      measure(() => take(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('until', () => {

  describe('UntilCharCodeRangeTaker', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^.*[bc]/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.untilCharBy((charCode) => charCode === 98 || charCode === 99, false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.until(next.char([98, 99]));
      measure(() => take(input, 0));
    });
  });

  describe('UntilCharCodeCheckerTaker', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^.*b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.until(next.char((charCode) => charCode === 98));
      measure(() => take(input, 0));
    });
  });

  describe('UntilCaseSensitiveTextTaker', () => {

    const input = 'aaaaaabc';

    test('RegExp', (measure) => {
      const re = /bc/;
      measure(() => re.exec(input));
    });

    test('indexOf', (measure) => {
      measure(() => input.indexOf('bc'));
    });

    test('latest', (measure) => {
      const take = latest.untilText('bc', false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.until(next.text('bc'));
      measure(() => take(input, 0));
    });
  });

  describe('UntilRegexTaker', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const take = next.until(next.regex(/b/));
      measure(() => take(input, 0));
    });
  });

}, {targetRme: 0.001});
