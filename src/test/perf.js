const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

describe('readme', () => {

  const input = 'aaaaa-123.123aaaaa';

  test('RegExp', (measure) => {
    const re = /[+-]?(?:0|[1-9])\d*(?:\.\d+)?/y;
    measure(() => {
      re.lastIndex = 5;
      re.exec(input);
    });
  });

  test('latest', (measure) => {

    const readZero = latest.char(48 /*0*/);

    const readLeadingDigit = latest.charBy((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

    const readDigits = latest.allCharBy((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/);

    const readDot = latest.char(46 /*.*/);

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

    measure(() => readNumber(input, 5));
  });

  test('next', (measure) => {
    const zeroReader = next.text('0');

    const leadingDigitReader = next.char([['1', '9']]);

    const digitsReader = next.all(next.char([['0', '9']]));

    const dotReader = next.text('.');

    const signReader = next.char(['+-']);

    const numberReader = next.seq(
        // sign
        next.maybe(signReader),

        // integer
        next.or(
            zeroReader,
            next.seq(
                leadingDigitReader,
                digitsReader,
            ),
        ),

        // fraction
        next.maybe(
            next.seq(
                dotReader,
                digitsReader,
            ),
        ),
    );

    const readNumber = next.toReaderFunction(numberReader);

    measure(() => readNumber(input, 5));
  });
}, {targetRme: 0.001});

describe('char', () => {

  describe('CharCodeRangeReader', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /[ab]/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.charBy((charCode) => charCode === 97 || charCode === 98);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.char(['ab']));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('all', () => {

  describe('AllCharCodeRangeReader', () => {

    const input = 'abababc';

    test('RegExp', (measure) => {
      const re = /[ab]*/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['ab'])));
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {minimumCount: 2}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /[ab]{2,}/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 2);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['ab']), {minimumCount: 2}));
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {maximumCount: 3}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /[ab]{,3}/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 0, 3);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['ab']), {maximumCount: 3}));
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {minimumCount: 2, maximumCount: 3}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /[ab]{2,3}/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 2, 3);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['ab']), {minimumCount: 2, maximumCount: 3}));
      measure(() => read(input, 0));
    });
  });

  describe('AllCharCodeRangeReader {minimumCount: 2, maximumCount: 2}', () => {

    const input = 'aaabbb';

    test('RegExp', (measure) => {
      const re = /[ab]{2}/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.allCharBy((charCode) => charCode === 97 || charCode === 98, 2, 2);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['ab']), {minimumCount: 2, maximumCount: 2}));
      measure(() => read(input, 0));
    });
  });

  describe('AllCaseSensitiveTextReader', () => {

    const input = 'ababababc';

    test('RegExp', (measure) => {
      const re = /(?:ab)*/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.all(latest.text('ab'));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.text('ab')));
      measure(() => read(input, 0));
    });
  });

  describe('AllRegexReader', () => {

    const input = 'ababababc';

    test('RegExp', (measure) => {
      const re = /(?:ab)*/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.all(latest.text('ab'));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.all(next.regex(/ab/)));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('or', () => {

  describe('OrReader', () => {

    const input = 'aaaa';

    test('RegExp', (measure) => {
      const re = /[cba]/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.or(latest.char(99), latest.char(98), latest.char(97));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.or(next.text('c'), next.text('b'), next.text('a')));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('seq', () => {

  describe('SeqReader', () => {

    const input = 'aaaa';

    test('RegExp', (measure) => {
      const re = /aaa/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.seq(latest.char(97), latest.char(97), latest.char(97));
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.seq(next.text('a'), next.text('a'), next.text('a')));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('text', () => {

  describe('CaseSensitiveTextReader', () => {

    const input = 'ababab';

    test('RegExp', (measure) => {
      const re = /ababa/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.text('ababa');
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.text('ababa'));
      measure(() => read(input, 0));
    });
  });

  describe('CaseInsensitiveTextReader', () => {

    const input = 'aBAbab';

    test('RegExp', (measure) => {
      const re = /ABABA/iy;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.text('ABABA', true);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.text('ABABA', {caseInsensitive: true}));
      measure(() => read(input, 0));
    });
  });
}, {targetRme: 0.001});

describe('until', () => {

  describe('UntilCharCodeRangeReader', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /.*[bc]/y;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.untilCharBy((charCode) => charCode === 98 || charCode === 99, false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.until(next.char(['ab'])));
      measure(() => read(input, 0));
    });
  });

  describe('UntilCaseSensitiveTextReader', () => {

    const input = 'aaaaaabc';

    test('RegExp', (measure) => {
      const re = /bc/g;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('indexOf', (measure) => {
      measure(() => input.indexOf('bc'));
    });

    test('latest', (measure) => {
      const read = latest.untilText('bc', false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.until(next.text('bc')));
      measure(() => read(input, 0));
    });
  });

  describe('UntilRegexReader', () => {

    const input = 'aaaaaab';

    test('RegExp', (measure) => {
      const re = /b/g;
      measure(() => {
        re.lastIndex = 0;
        re.exec(input);
      });
    });

    test('latest', (measure) => {
      const read = latest.untilCharBy((charCode) => charCode === 98, false, false);
      measure(() => read(input, 0));
    });

    test('next', (measure) => {
      const read = next.toReaderFunction(next.until(next.regex(/b/)));
      measure(() => read(input, 0));
    });
  });

}, {targetRme: 0.001});
