const chalk = require('chalk');
const {test} = require('@smikhalevski/perf-test');
const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

const doGc = () => global.gc();


console.log('\n' + chalk.bold.inverse(' char '));

console.log('\n' + chalk.bold('charCode'));
{
  const input = 'ababababababbbaaba';

  const reText = /^a/;
  const latestText = latest.char(97);
  const nextText = next.char(97);

  test('/^a/  ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('charCodeChecker'));
{
  const input = 'ababababababbbaaba';

  const reText = /^a/;
  const latestText = latest.charBy((charCode) => charCode === 97);
  const nextText = next.char((charCode) => charCode === 97);

  test('/^a/  ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' text '));

console.log('\n' + chalk.bold('ASCII/length=1/caseSensitive=true'));
{
  const input = 'ababababababbbaaba';

  const reText = /^a/;
  const latestText = latest.text('a');
  const nextText = next.text('a');

  test('/^a/  ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('ASCII/length=1/caseSensitive=false'));
{
  const input = 'ababababababbbaaba';

  const reText = /^A/i;
  const latestText = latest.text('A', true);
  const nextText = next.text('A', {caseSensitive: false});

  test('/^A/i ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('ASCII/length=5/caseSensitive=true'));
{
  const input = 'ababababababbbaaba';

  const reText = /^ababa/;
  const latestText = latest.text('ababa');
  const nextText = next.text('ababa');

  test('/^ababa/', () => reText.exec(input));
  doGc();
  test('latest  ', () => latestText(input, 0));
  doGc();
  test('next    ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('ASCII/length=5/caseSensitive=false'));
{
  const input = 'ababababababbbaaba';

  const reText = /^ABABA/i;
  const latestText = latest.text('ABABA', true);
  const nextText = next.text('ABABA', {caseSensitive: false});

  test('/^ABABA/i', () => reText.exec(input));
  doGc();
  test('latest   ', () => latestText(input, 0));
  doGc();
  test('next     ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=1/caseSensitive=true'));
{
  const input = 'åω';

  const reText = /^å/;
  const latestText = latest.text('å');
  const nextText = next.text('å');

  test('/^å/  ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=1/caseSensitive=false'));
{
  const input = 'åω';

  const reText = /^Å/i;
  const latestText = latest.text('Å', true);
  const nextText = next.text('Å', {caseSensitive: false});

  test('/^Å/i ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=5/caseSensitive=true'));
{
  const input = 'åωызк';

  const reText = /^åωызк/;
  const latestText = latest.text('åωызк');
  const nextText = next.text('åωызк');

  test('/^åωызк/', () => reText.exec(input));
  doGc();
  test('latest  ', () => latestText(input, 0));
  doGc();
  test('next    ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('non-ASCII/length=5/caseSensitive=false'));
{
  const input = 'åωызк';

  const reText = /^ÅΩЫЗК/i;
  const latestText = latest.text('ÅΩЫЗК', true);
  const nextText = next.text('ÅΩЫЗК', {caseSensitive: false});

  test('/^ÅΩЫЗК/i', () => reText.exec(input));
  doGc();
  test('latest   ', () => latestText(input, 0));
  doGc();
  test('next     ', () => nextText(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' all '));

console.log('\n' + chalk.bold('char'));
{
  const input = 'aaaaaab';

  const reText = /^a*/;
  const latestText = latest.all(latest.char(97));
  const nextText = next.all(next.char(97));

  test('/^a*/ ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/minimumCount=1'));
{
  const input = 'aaaaaab';

  const reText = /^a+/;
  const latestText = latest.all(latest.char(97), 1);
  const nextText = next.all(next.char(97), {minimumCount: 1});

  test('/^a+/ ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/maximumCount=3'));
{
  const input = 'aaaaaab';

  const reText = /^a{0,3}/;
  const latestText = latest.all(latest.char(97), 0, 3);
  const nextText = next.all(next.char(97), {maximumCount: 3});

  test('/^a{0,3}/', () => reText.exec(input));
  doGc();
  test('latest   ', () => latestText(input, 0));
  doGc();
  test('next     ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('charCodeChecker'));
{
  const input = 'aaaaaab';

  const reText = /^a*/;
  const latestText = latest.allCharBy((charCode) => charCode === 97);
  const nextText = next.all(next.char((charCode) => charCode === 97));

  test('/^a*/ ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('text'));
{
  const input = 'abcabcabc';

  const reText = /^(abc)*/;
  const latestText = latest.all(latest.text('abc'));
  const nextText = next.all(next.text('abc'));

  test('/^(abc)*/', () => reText.exec(input));
  doGc();
  test('latest   ', () => latestText(input, 0));
  doGc();
  test('next     ', () => nextText(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' until '));

console.log('\n' + chalk.bold('char'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

  const reText = /^.*b/;
  const latestText = latest.untilText('b', false, false);
  const nextText = next.until(next.char(98));

  test('/^.*b/', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/open-ended'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

  const reText = /^.*b/;
  const latestText = latest.untilText('b', false, true);
  const nextText = next.or(next.until(next.char(98)), next.end());

  test('/^.*b/', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('charCodeChecker'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

  const reText = /^.*b/;
  const latestText = latest.untilCharBy((charCode) => charCode === 98, false, false);
  const nextText = next.until(next.char((charCode) => charCode === 98));

  test('/^.*b/', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('text'));
{
  const input = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaaaaa';

  const reText = /^.*ba/;
  const latestText = latest.untilText('ba', false, false);
  const nextText = next.until(next.text('ba'));

  test('/^.*ba/', () => reText.exec(input));
  doGc();
  test('indexOf', () => input.indexOf('ba'));
  doGc();
  test('latest ', () => latestText(input, 0));
  doGc();
  test('next   ', () => nextText(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' seq '));

console.log('\n' + chalk.bold('char/2'));
{
  const input = 'aaa';

  const reText = /^aa/;
  const latestText = latest.seq(latest.char(97), latest.char(97));
  const nextText = next.seq(next.char(97), next.char(97));

  test('/^aa/ ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/3'));
{
  const input = 'aaaa';

  const reText = /^aaa/;
  const latestText = latest.seq(latest.char(97), latest.char(97), latest.char(97));
  const nextText = next.seq(next.char(97), next.char(97), next.char(97));

  test('/^aaa/', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}


console.log('\n' + chalk.bold.inverse(' or '));

console.log('\n' + chalk.bold('char/2'));
{
  const input = 'aaa';

  const reText = /^aa/;
  const latestText = latest.seq(latest.char(98), latest.char(97));
  const nextText = next.seq(next.char(98), next.char(97));

  test('/^aa/ ', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}

console.log('\n' + chalk.bold('char/3'));
{
  const input = 'aaaa';

  const reText = /^aaa/;
  const latestText = latest.seq(latest.char(98), latest.char(98), latest.char(97));
  const nextText = next.seq(next.char(98), next.char(98), next.char(97));

  test('/^aaa/', () => reText.exec(input));
  doGc();
  test('latest', () => latestText(input, 0));
  doGc();
  test('next  ', () => nextText(input, 0));
  doGc();
}
