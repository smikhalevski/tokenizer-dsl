const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

describe('Docs', () => {

  const input = '-123.123aaaaa';

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

    const takeLeadingDigit = next.char((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

    const takeDigits = next.all(next.char((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/));

    const takeDot = next.text('.');

    const takeSign = next.char((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

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

    measure(() => takeNumber.take(input, 0));
  });
});

describe('char', () => {

  describe('CharTaker', () => {

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
      const taker = next.char((charCode) => charCode === 97);
      measure(() => taker.take(input, 0));
    });
  });
});

describe('all', () => {

  describe('AllCharTaker', () => {

    const input = 'aaaaaag';

    test('RegExp', (measure) => {
      const re = /^a*!/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.allCharBy((charCode) => charCode === 97);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.all(next.char((charCode) => charCode === 97));
      measure(() => taker.take(input, 0));
    });
  });

  describe('AllCharTaker {minimumCount: 1}', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^a+/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.allCharBy((charCode) => charCode === 97, 1);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.all(next.char((charCode) => charCode === 97), {minimumCount: 1});
      measure(() => taker.take(input, 0));
    });
  });

  describe('AllCharTaker {maximumCount: 3}', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^a{0,3}/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.allCharBy((charCode) => charCode === 97, 0, 3);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.all(next.char((charCode) => charCode === 97), {maximumCount: 3});
      measure(() => taker.take(input, 0));
    });
  });

  describe('AllCaseSensitiveTextTaker', () => {

    const input = 'abcabcabcabcabcabcabcabcabcabcabcabcabc';

    test('RegExp', (measure) => {
      const re = /^(abcabcabcabca)*!/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.all(latest.text('abcabcabcabca'));
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.all(next.text('abcabcabcabca'));
      measure(() => taker.take(input, 0));
    });
  });
});

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
      const taker = next.or(next.text('c'), next.text('b'), next.text('a'));
      measure(() => taker.take(input, 0));
    });
  });
});

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
      const taker = next.seq(next.text('a'), next.text('a'), next.text('a'));
      measure(() => taker.take(input, 0));
    });
  });
});

describe('text', () => {

  describe('CaseSensitiveCharTaker', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^a/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.char(97);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.text('a');
      measure(() => taker.take(input, 0));
    });
  });

  describe('CaseInsensitiveCharTaker', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^A/i;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.charBy((charCode) => charCode === 65 || charCode === 97);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.text('A', {caseInsensitive: true});
      measure(() => taker.take(input, 0));
    });
  });

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
      const taker = next.text('ababa');
      measure(() => taker.take(input, 0));
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
      const taker = next.text('ABABA', {caseInsensitive: true});
      measure(() => taker.take(input, 0));
    });
  });
});

describe('until', () => {

  describe('UntilCharTaker', () => {

    const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

    test('RegExp', (measure) => {
      const re = /^.*b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.until(next.char((charCode) => charCode === 98));
      measure(() => taker.take(input, 0));
    });
  });

  describe('UntilCaseSensitiveTextTaker', () => {

    const input = 'a'.repeat(1000) + 'b';

    test('RegExp', (measure) => {
      const re = /b/;
      measure(() => re.exec(input));
    });

    test('indexOf', (measure) => {
      measure(() => input.indexOf('b'));
    });

    test('latest', (measure) => {
      const take = latest.untilText('b', false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.until(next.text('b'));
      measure(() => taker.take(input, 0));
    });
  });

  describe('UntilCaseSensitiveTextTaker {openEnded: true}', () => {

    const input = 'a'.repeat(1000) + 'b';

    test('RegExp', (measure) => {
      const re = /b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.untilText('b', false, true);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.until(next.text('b'), {openEnded: true});
      measure(() => taker.take(input, 0));
    });
  });

  describe('UntilRegexTaker', () => {

    const input = 'a'.repeat(1000) + 'b';

    test('RegExp', (measure) => {
      const re = /b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const take = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => take(input, 0));
    });

    test('next', (measure) => {
      const taker = next.until(next.regex(/b/));
      measure(() => taker.take(input, 0));
    });
  });

});
