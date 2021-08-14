const chalk = require('chalk');
const {test} = require('@smikhalevski/perf-test');
const latest = require('tokenizer-dsl');
const next = require('../../lib/index-cjs');

const ascii = 'aaa';
const nonAscii = 'ÅΩ∑';

const afterTest = () => global.gc();


console.log(chalk.bold.inverse(' all ') + '\n');

const reAll = /a+/;
const latestAllCharBy = latest.allCharBy((c) => c === 97);
const nextAll1 = next.all((c) => c === 97);

test('/a+/  ', () => reAll.exec(ascii));
afterTest();
test('latest', () => latestAllCharBy(ascii, 0));
afterTest();
test('next  ', () => nextAll1(ascii, 0));
afterTest();


console.log('\n' + chalk.bold.inverse(' text ') + '\n');

const reText1 = RegExp(ascii);
const latestText1 = latest.text(ascii);
const nextText1 = next.text(ascii);

test('/aaa/ ', () => reText1.exec(ascii));
afterTest();
test('latest', () => latestText1(ascii, 0));
afterTest();
test('next  ', () => nextText1(ascii, 0));
afterTest();


console.log('\n' + chalk.bold.inverse(' text/ASCII/caseInsensitive ') + '\n');

const reText2 = RegExp(ascii, 'i');
const latestText2 = latest.text(ascii, true);
const nextText2 = next.text(ascii, {caseInsensitive: true});

test('/aaa/i', () => reText2.exec(ascii));
afterTest();
test('latest', () => latestText2(ascii, 0));
afterTest();
test('next  ', () => nextText2(ascii, 0));
afterTest();


console.log('\n' + chalk.bold.inverse(' text/non-ASCII/caseInsensitive ') + '\n');

const reText3 = RegExp(nonAscii, 'i');
const latestText3 = latest.text(nonAscii, true);
const nextText3 = next.text(nonAscii, {caseInsensitive: true});

test('/aaa/i', () => reText3.exec(nonAscii));
afterTest();
test('latest', () => latestText3(nonAscii, 0));
afterTest();
test('next  ', () => nextText3(nonAscii, 0));
afterTest();
