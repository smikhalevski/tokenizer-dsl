const packageJson = require('../../package.json');
const next = require('../../lib/index-cjs');

const nextVersion = 'v' + packageJson.version;

describe('Tokenizer', () => {

  const input = '123.456; +777; -42';
  // const input = '123123123123123123123123123123123.456456456456456456456456456456456; aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; +777777777777777777777777777777777777777777777777; bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; -42424242424242424242424242424242; ccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

  // This is a very close approximation of an actual algorithm generated by tokenizer-dsl
  test('RegExp', (measure) => {

    const reNumber = /[-+]?(?:0|[1-9]\d*)(?:\.\d*)?/y;

    const reAlpha = /[a-z]+/y;

    const reSemicolon = /;/y;

    const reWhitespace = /[ \t\r\n]+/y;

    const handler = {
      token(chunk, offset, length) {
      },
    };

    const tokenizer = (input, stage, offset, handler) => {
      let lastIndex;

      while (true) {

        switch (stage) {

          case 0:

            reNumber.lastIndex = offset;
            if (reNumber.test(input) && offset < (lastIndex = reNumber.lastIndex)) {
              handler.token(input, offset, lastIndex - offset);
              offset = lastIndex;
              stage = 1;
              continue;
            }

            reAlpha.lastIndex = offset;
            if (reAlpha.test(input) && offset < (lastIndex = reAlpha.lastIndex)) {
              handler.token(input, offset, lastIndex - offset);
              offset = lastIndex;
              stage = 1;
              continue;
            }

            break;

          case 1:
            reSemicolon.lastIndex = offset;
            if (reSemicolon.test(input) && offset < (offset = reSemicolon.lastIndex)) {
              stage = 0;
              continue;
            }
            break;
        }

        reWhitespace.lastIndex = offset;
        if (reWhitespace.test(input) && offset < (offset = reWhitespace.lastIndex)) {
          continue;
        }

        break;
      }

      return [stage, offset];
    };

    measure(() => tokenizer(input, 0, 0, handler));

  });

  test(nextVersion, (measure) => {

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

    const alphaReader = next.all(next.char([['a', 'z']]), {minimumCount: 1});

    const semicolonReader = next.text(';');

    const whitespaceReader = next.all(next.char([' \t\n\r']));

    const tokenizer = next.createTokenizer([
      {
        on: [0],
        type: 'ALPHA',
        reader: alphaReader,
        to: 1,
      },
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
      },
    };

    measure(() => tokenizer(input, handler));

  });

}, {targetRme: 0.001});

describe('char', () => {

  describe('CharCodeRangeReader\tchar(["abc"])', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
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
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.char([['a', 'z']]));
      measure(() => read(input, 3));
    });
  });

}, {targetRme: 0.001});

describe('all', () => {

  describe('AllReader\tall(char(["abc"]))', () => {

    const input = '___abcabc___';

    test('RegExp', (measure) => {
      const re = /[abc]*/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc'])));
      measure(() => read(input, 3));
    });
  });

  describe('AllReader\tall(char(["abc"]), {minimumCount: 2})', () => {

    const input = '___abcabc___';

    test('RegExp', (measure) => {
      const re = /[abc]{2,}/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {minimumCount: 2}));
      measure(() => read(input, 3));
    });
  });

  describe('AllReader\tall(char(["abc"]), {maximumCount: 3})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{,3}/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {maximumCount: 3}));
      measure(() => read(input, 3));
    });
  });

  describe('AllReader\tall(char(["abc"]), {minimumCount: 2, maximumCount: 3})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{2,3}/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {minimumCount: 2, maximumCount: 3}));
      measure(() => read(input, 3));
    });
  });

  describe('AllReader\tall(char(["abc"]), {minimumCount: 2, maximumCount: 2})', () => {

    const input = '___abc___';

    test('RegExp', (measure) => {
      const re = /[abc]{2}/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.char(['abc']), {minimumCount: 2, maximumCount: 2}));
      measure(() => read(input, 3));
    });
  });

  describe('AllReader\tall(text(["abc"]))', () => {

    const input = '___abcabcabc___';

    test('RegExp', (measure) => {
      const re = /(?:abc)*/y;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.all(next.text('abc')));
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
        re.test(input);
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
        re.test(input);
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
        re.test(input);
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
        re.test(input);
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
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.char(['abc'])));
      measure(() => read(input, 3));
    });
  });

  describe('UntilCharCodeRangeReader\tuntil(char(["abc"]), {inclusive: true})', () => {

    const input = '_________abc___';

    test('RegExp', (measure) => {
      const re = /[abc]/g;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.char(['abc']), {inclusive: true}));
      measure(() => read(input, 3));
    });
  });

  describe('UntilCaseSensitiveTextReader\tuntil(text("abc"))', () => {

    const input = '_________abc___';

    test('RegExp', (measure) => {
      const re = /(?=abc)/g;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
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
        re.test(input);
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

  describe('UntilReader\tuntil(text("abc", {caseInsensitive: true}))', () => {

    const input = '_________ABC___';

    test('RegExp', (measure) => {
      const re = /(?=abc)/ig;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.text('abc', {caseInsensitive: true})));
      measure(() => read(input, 3));
    });
  });

  describe('UntilReader\tuntil(text("abc", {caseInsensitive: true}), {inclusive: true})', () => {

    const input = '_________ABC___';

    test('RegExp', (measure) => {
      const re = /abc/ig;
      measure(() => {
        re.lastIndex = 3;
        re.test(input);
      });
    });

    test(nextVersion, (measure) => {
      const read = next.toReaderFunction(next.until(next.text('abc', {caseInsensitive: true}), {inclusive: true}));
      measure(() => read(input, 3));
    });
  });

}, {targetRme: 0.001});
