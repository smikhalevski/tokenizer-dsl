const packageJson = require('../../package.json');
const next = require('../../lib/index-cjs');

const nextVersion = 'v' + packageJson.version;

describe('Tokenizer', () => {

  test('End-to-end', (measure) => {

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

    const semicolonReader = next.text(';');

    const whitespaceReader = next.all(next.char([' \t\n\r']));

    const tokenizer = next.createTokenizer([
      {
        on: [0],
        type: 'NUMBER',
        reader: numberReader,
        to: 1,
      },
      {
        on: [1],
        reader: semicolonReader,
        silent: true,
        to: 0,
      },
      {
        reader: whitespaceReader,
        silent: true,
      },
    ], 0);

    const handler = {
      token(chunk, type, offset, length, context, state) {
        context.fooBar = state.chunkOffset + offset;
      },
    };

    measure(() => tokenizer('123.456; +777; -42', handler, {fooBar: 0}));

  });

}, {targetRme: 0.001});

describe('char', () => {

  describe('CharCodeRangeReader\tchar(["abc"])', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.char(['abc']));
      measure(() => read(input, 3));
    });
  });

  describe('CharCodeRangeReader\tchar([["a", "z"]])', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[a-z]/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.char([['a', 'z']]));
      measure(() => read(input, 3));
    });
  });

}, {targetRme: 0.001});

describe('all', () => {

  describe('AllCharCodeRangeReader\tall(char(["abc"]))', () => {

    const input = '___abcabc___';

    test('RegExp', (measure) => {
      const re = /[abc]*/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc'])));
      measure(() => read(input, 3));
    });
  });

  describe('AllCharCodeRangeReader\tall(char(["abc"]), {minimumCount: 2})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{2,}/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {minimumCount: 2}));
      measure(() => read(input, 3));
    });
  });

  describe('AllCharCodeRangeReader\tall(char(["abc"]), {maximumCount: 3})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{,3}/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {maximumCount: 3}));
      measure(() => read(input, 3));
    });
  });

  describe('AllCharCodeRangeReader\tall(char(["abc"]), {minimumCount: 2, maximumCount: 3})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{2,3}/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {minimumCount: 2, maximumCount: 3}));
      measure(() => read(input, 3));
    });
  });

  describe('AllCharCodeRangeReader\tall(char(["abc"]), {minimumCount: 2, maximumCount: 2})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{2}/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {minimumCount: 2, maximumCount: 2}));
      measure(() => read(input, 3));
    });
  });

  describe('AllCaseSensitiveTextReader\tall(text("abc"))', () => {

    const input = '___abcabc___';

    test('RegExp', (measure) => {
      const re = /(?:abc)*/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.text('abc')));
      measure(() => read(input, 3));
    });
  });

  describe('AllRegexReader\tall(regex(/abc/))', () => {

    const input = '___abcabc___';

    test('RegExp', (measure) => {
      const re = /(?:abc)*/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.regex(/abc/)));
      measure(() => read(input, 3));
    });
  });
}, {targetRme: 0.001});

describe('or', () => {

  describe('OrReader\tor(text("abc"), text("123"))', () => {

    const input = '___123___';

    test('RegExp', (measure) => {
      const re = /abc|123/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.or(next.text('abc'), next.text('123')));
      measure(() => read(input, 3));
    });
  });
}, {targetRme: 0.001});

describe('seq', () => {

  describe('SeqReader\tseq(text(\'abc\'), text(\'123\'))', () => {

    const input = '___abc123___';

    test('RegExp', (measure) => {
      const re = /abc123/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.seq(next.text('abc'), next.text('123')));
      measure(() => read(input, 3));
    });
  });
}, {targetRme: 0.001});

describe('text', () => {

  describe('CaseSensitiveTextReader\ttext("abc")', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /abc/y;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.text('abc'));
      measure(() => read(input, 3));
    });
  });

  describe('CaseInsensitiveTextReader\ttext("abc", {caseInsensitive: true})', () => {

    const input = '___ABC___';

    test('RegExp', (measure) => {
      const re = /abc/iy;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.text('abc', {caseInsensitive: true}));
      measure(() => read(input, 3));
    });
  });
}, {targetRme: 0.001});

describe('until', () => {

  describe('UntilCharCodeRangeReader\tuntil(char(["abc"]))', () => {

    const input = '_________abc___';

    test('RegExp', (measure) => {
      const re = /[abc]/g;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.char(['abc'])));
      measure(() => read(input, 3));
    });
  });

  describe('UntilCaseSensitiveTextReader\tuntil(text("abc"))', () => {

    const input = '_________abc___';

    test('RegExp', (measure) => {
      const re = /(?=abc)/g;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test('indexOf', (measure) => {
      measure(() => input.indexOf('abc'));
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.text('abc')));
      measure(() => read(input, 3));
    });
  });

  describe('UntilCaseSensitiveTextReader\tuntil(text("abc"), {inclusive: true})', () => {

    const input = '_________abc___';

    test('RegExp', (measure) => {
      const re = /abc/g;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test('indexOf', (measure) => {
      measure(() => input.indexOf('abc'));
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.text('abc'), {inclusive: true}));
      measure(() => read(input, 3));
    });
  });

  describe('UntilRegexReader\tuntil(regex(/abc/))', () => {

    const input = '_________abc___';

    test('RegExp', (measure) => {
      const re = /abc/g;
      measure(() => {
        re.lastIndex = 3;
        re.exec(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.regex(/abc/)));
      measure(() => read(input, 3));
    });
  });

}, {targetRme: 0.001});
