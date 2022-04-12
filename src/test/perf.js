const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

describe('readme', () => {

  const input = '-123.123aaaaa';

  test('RegExp', (measure) => {
    const re = /^[+-]?(?:0|[1-9])\d*(?:\.\d+)?/;
    measure(() => re.exec(input));
  });

  test('latest', (measure) => {

    const readZero = latest.char('0'.charCodeAt(0));

    const readLeadingDigit = latest.charBy((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

    const readDigits = latest.allCharBy((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/);

    const readDot = latest.char('.'.charCodeAt(0));

    const readSign = latest.charBy((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

    const readNumber = latest.seq(
        // sign
        latest.maybe(readSign),

        // integer
        latest.or(
            readZero,
            latest.seq(
                readLeadingDigit,
                readDigits,
            ),
        ),

        // fraction
        latest.maybe(
            latest.seq(
                readDot,
                readDigits,
            ),
        ),
    );

    measure(() => readNumber(input, 0));
  });

  test('next', (measure) => {
    const readZero = next.text('0');

    const readLeadingDigit = next.char([[49 /*1*/, 57 /*9*/]]);

    const readDigits = next.all(next.char([[48 /*0*/, 57 /*9*/]]));

    const readDot = next.text('.');

    const readSign = next.char([43 /*+*/, 45 /*-*/]);

    const readNumber = next.seq(
        // sign
        next.maybe(readSign),

        // integer
        next.or(
            readZero,
            next.seq(
                readLeadingDigit,
                readDigits,
            ),
        ),

        // fraction
        next.maybe(
            next.seq(
                readDot,
                readDigits,
            ),
        ),
    );

    measure(() => readNumber(input, 0));
  });
}, {targetRme: 0.001});

describe('char', () => {

  describe('CharCodeCheckerReader', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^a/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.charBy((charCode) => charCode === 97);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.char((charCode) => charCode === 97);
      measure(() => read(input, 0));
    });
  });

  describe('CharCodeRangeReader', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^[ab]/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.charBy((charCode) => charCode === 97 || charCode === 98);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.char([97, 98]);
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('all', () => {

  describe('AllCharCodeCheckerReader', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^a*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.char((charCode) => charCode === 97));
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader', () => {

    const input = 'abababc';

    test('RegExp', (measure) => {
      const re = /^[ab]*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.char([97, 98]));
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {minimumCount: 2}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /^[ab]{2,}/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 2);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.char([97, 98]), {minimumCount: 2});
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {maximumCount: 3}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /^[ab]{,3}/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 0, 3);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.char([97, 98]), {maximumCount: 3});
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {minimumCount: 2, maximumCount: 3}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /^[ab]{2,3}/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 2, 3);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.char([97, 98]), {minimumCount: 2, maximumCount: 3});
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {minimumCount: 2, maximumCount: 2}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /^[ab]{2}/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 2, 2);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.char([97, 98]), {minimumCount: 2, maximumCount: 2});
      measure(() => read(input, 0));
    });
  });

  describe('AllCaseSensitiveTextReader', () => {

    const input = 'ababababc';

    test('RegExp', (measure) => {
      const re = /^(?:ab)*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.all(latest.text('ab'));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.text('ab'));
      measure(() => read(input, 0));
    });
  });

  describe('AllRegexReader', () => {

    const input = 'ababababc';

    test('RegExp', (measure) => {
      const re = /^(?:ab)*/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.all(latest.text('ab'));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.all(next.regex(/ab/));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('or', () => {

  describe('OrReader', () => {

    const input = 'aaaa';

    test('RegExp', (measure) => {
      const re = /^[cba]/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.or(latest.char(99), latest.char(98), latest.char(97));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.or(next.text('c'), next.text('b'), next.text('a'));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('seq', () => {

  describe('SeqReader', () => {

    const input = 'aaaa';

    test('RegExp', (measure) => {
      const re = /^aaa/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.seq(latest.char(97), latest.char(97), latest.char(97));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.seq(next.text('a'), next.text('a'), next.text('a'));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('text', () => {

  describe('CaseSensitiveTextReader', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /^ababa/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.text('ababa');
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.text('ababa');
      measure(() => read(input, 0));
    });
  });

  describe('CaseInsensitiveTextReader', () => {

    const input = 'aBAbab';

    test('RegExp', (measure) => {
      const re = /^ABABA/i;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.text('ABABA', true);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.text('ABABA', {caseInsensitive: true});
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('until', () => {

  describe('UntilCharCodeRangeReader', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^.*[bc]/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.untilCharBy((charCode) => charCode === 98 || charCode === 99, false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.until(next.char([98, 99]));
      measure(() => read(input, 0));
    });
  });

  describe('UntilCharCodeCheckerReader', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /^.*b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.until(next.char((charCode) => charCode === 98));
      measure(() => read(input, 0));
    });
  });

  describe('UntilCaseSensitiveTextReader', () => {

    const input = 'aaaaaabc';

    test('RegExp', (measure) => {
      const re = /bc/;
      measure(() => re.exec(input));
    });

    test('indexOf', (measure) => {
      measure(() => input.indexOf('bc'));
    });

    test('latest', (measure) => {
      const read = latest.untilText('bc', false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.until(next.text('bc'));
      measure(() => read(input, 0));
    });
  });

  describe('UntilRegexReader', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /b/;
      measure(() => re.exec(input));
    });

    test('latest', (measure) => {
      const read = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.until(next.regex(/b/));
      measure(() => read(input, 0));
    });
  });

}, {targetRme: 0.001});
