const chalk = require('chalk');
const {test} = require('@smikhalevski/perf-test');
const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

const doGc = () => global.gc();


console.log('\n' + chalk.bold.inverse(' Docs ') + '\n');

{
  const input = '-123.123aaaaa';

  const re = /^[+-]?(?:0|[1-9]\d*)(?:\.\d*)?/;

  test('regexp', () => re.exec(input));
  doGc();

  {

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

    const takeLatest = takeNumber;

    test('latest', () => takeLatest(input, 0));
  }

  {

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

    const takeNext = takeNumber;

    test('next  ', () => takeNext.take(input, 0));
  }
}

console.log('\n' + chalk.bold.inverse(' char ') + '\n');

{
  const input = 'ababab';

  const re = /^a/;
  const takeLatest = latest.charBy((charCode) => charCode === 97);
  const takeNext = next.char((charCode) => charCode === 97);

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' text '));

console.log('\n' + chalk.bold('ASCII/length=1/caseSensitive=true'));
{
  const input = 'ababab';

  const re = /^a/;
  const takeLatest = latest.char(97);
  const takeNext = next.text('a');

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('ASCII/length=1/caseSensitive=false'));
{
  const input = 'ababab';

  const re = /^A/i;
  const takeLatest = latest.text('A', true);
  const takeNext = next.text('A', {caseSensitive: false});

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('ASCII/length=5/caseSensitive=true'));
{
  const input = 'ababab';

  const re = /^ababa/;
  const takeLatest = latest.text('ababa');
  const takeNext = next.text('ababa');

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('ASCII/length=5/caseSensitive=false'));
{
  const input = 'aBAbab';

  const re = /^ABABA/i;
  const takeLatest = latest.text('ABABA', true);
  const takeNext = next.text('ABABA', {caseSensitive: false});

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=1/caseSensitive=true'));
{
  const input = 'åω';

  const re = /^å/;
  const takeLatest = latest.text('å');
  const takeNext = next.text('å');

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=1/caseSensitive=false'));
{
  const input = 'åω';

  const re = /^Å/i;
  const takeLatest = latest.text('Å', true);
  const takeNext = next.text('Å', {caseSensitive: false});

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=5/caseSensitive=true'));
{
  const input = 'åωызк';

  const re = /^åωызк/;
  const takeLatest = latest.text('åωызк');
  const takeNext = next.text('åωызк');

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=5/caseSensitive=false'));
{
  const input = 'åΩЫзк';

  const re = /^ÅΩЫЗК/i;
  const takeLatest = latest.text('ÅΩЫЗК', true);
  const takeNext = next.text('ÅΩЫЗК', {caseSensitive: false});

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' all '));

console.log('\n' + chalk.bold('char'));
{
  const input = 'aaaaaab';

  const re = /^a*/;
  const takeLatest = latest.allCharBy((charCode) => charCode === 97);
  const takeNext = next.all(next.char((charCode) => charCode === 97));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/minimumCount=1'));
{
  const input = 'aaaaaab';

  const re = /^a+/;
  const takeLatest = latest.allCharBy((charCode) => charCode === 97, 1);
  const takeNext = next.all(next.char((charCode) => charCode === 97), {minimumCount: 1});

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/maximumCount=3'));
{
  const input = 'aaaaaab';

  const re = /^a{0,3}/;
  const takeLatest = latest.allCharBy((charCode) => charCode === 97, 0, 3);
  const takeNext = next.all(next.char((charCode) => charCode === 97), {maximumCount: 3});

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('text'));
{
  const input = 'abcabcabcabcabcabcabcabcabcabcabcabcabc';

  const re = /^(abcabcabcabca)*/;
  const takeLatest = latest.all(latest.text('abcabcabcabca'));
  const takeNext = next.all(next.text('abcabcabcabca'));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' until '));

console.log('\n' + chalk.bold('char'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

  const re = /^.*b/;
  const takeLatest = latest.untilText('b', false, false);
  const takeNext = next.until(next.text('b'));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/open-ended'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  const re = /^.*b/;
  const takeLatest = latest.untilText('b', false, true);
  const takeNext = next.or(next.until(next.text('b')), next.end());

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('charCodeChecker'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

  const re = /^.*b/;
  const takeLatest = latest.untilCharBy((charCode) => charCode === 98, false, false);
  const takeNext = next.until(next.char((charCode) => charCode === 98));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('text'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

  const re = /^.*ba/;
  const takeLatest = latest.untilText('ba', false, false);
  const takeNext = next.until(next.text('ba'));

  test('regexp ', () => re.exec(input));
  doGc();
  test('indexOf', () => input.indexOf('ba'));
  doGc();
  test('latest ', () => takeLatest(input, 0));
  doGc();
  test('next   ', () => takeNext.take(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' seq '));

console.log('\n' + chalk.bold('char/2'));
{
  const input = 'aaa';

  const re = /^aa/;
  const takeLatest = latest.seq(latest.char(97), latest.char(97));
  const takeNext = next.seq(next.text('a'), next.text('a'));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/3'));
{
  const input = 'aaaa';

  const re = /^aaa/;
  const takeLatest = latest.seq(latest.char(97), latest.char(97), latest.char(97));
  const takeNext = next.seq(next.text('a'), next.text('a'), next.text('a'));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' or '));

console.log('\n' + chalk.bold('char/2'));
{
  const input = 'aaa';

  const re = /^[ba][ba]/;
  const takeLatest = latest.or(latest.char(98), latest.char(97));
  const takeNext = next.or(next.text('b'), next.text('a'));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/3'));
{
  const input = 'aaaa';

  const re = /^[cba]/;
  const takeLatest = latest.or(latest.char(99), latest.char(98), latest.char(97));
  const takeNext = next.or(next.text('c'), next.text('b'), next.text('a'));

  test('regexp', () => re.exec(input));
  doGc();
  test('latest', () => takeLatest(input, 0));
  doGc();
  test('next  ', () => takeNext.take(input, 0));
  doGc();
}
