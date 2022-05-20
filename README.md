# tokenizer-dsl 🪵 [![build](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml)

The API for building streaming tokenizers and lexers.

- [2× faster than `RegExp`-based alternatives](#performance);
- [3.5 kB gzipped](https://bundlephobia.com/result?p=tokenizer-dsl) including dependencies;
- No heap allocations during tokenization;
- Compiled tokenizer is a pure function;

```shell
npm install --save-prod tokenizer-dsl
```

- [Usage](#usage)
- [Built-in readers](#built-in-readers)<br>
  [`text`](#text) [`char`](#char) [`regex`](#regex) [`all`](#all) [`seq`](#seq) [`or`](#or) [`skip`](#skip) [`until`](#until) [`end`](#end) [`lookahead`](#lookahead) [`maybe`](#maybe) [`never`](#never) [`none`](#none)
- [Functional readers](#functional-readers)
- [Code-generated readers](#code-generated-readers)
- [Rules](#rules)
    - [Rule stages](#rule-stages)
    - [Silent rules](#silent-rules)
- [Context](#context)
- [Error handling](#error-handling)
- [Streaming](#streaming)
- [Performance](#performance)

# Usage

The extensive example below shows how to define readers, and compile a pure tokenizer function that would read a list of
signed floating-point numbers separated by a semicolon.

Let's consider the input string that contains lowercase-alpha strings and floating-point numbers separated by a single
semicolon and an arbitrary number of space characters:

```ts
'123.456; aaa; +777; bbb; -42'
```

First we need to describe [readers](#readers) that would read chars from the input string. Readers are described
in-depth in [Readers](#readers) chapter.

Readers for semicolons and whitespaces are pretty straightforward:

```ts
import {all, char, text} from 'tokenizer-dsl';

const semicolonReader = text(';');

const whitespaceReader = all(char([' \t\n\r']));
```

To read a lowercase-alpha string we would use the combination of `all` and `char` readers with `minimumCount` option:

```ts
import {all, char} from 'tokenizer-dsl';

const alphaReader = all(char([['a', 'z']]), {minimumCount: 1});
```

This reader works the same way as `/[a-z]+/y`.

To read a signed floating-point number we need a combination of multiple readers:

```ts
import {all, char, maybe, or, seq, text} from 'tokenizer-dsl';

const zeroReader = text('0');

const leadingDigitReader = char([['1', '9']]);

const digitsReader = all(char([['0', '9']]));

const dotReader = text('.');

const signReader = char(['+-']);

const numberReader = seq(
    // sign
    maybe(signReader),

    // integer
    or(
        zeroReader,
        seq(
            leadingDigitReader,
            digitsReader
        )
    ),

    // fraction
    maybe(
        seq(
            dotReader,
            digitsReader
        )
    )
);
```

This reader works the same way as `/[-+]?(?:0|[1-9]\d*)(?:\.\d*)?/y`.

Now, after we defined all required readers, we can declare [tokenization rules](#rules):

```ts
import {Rule} from 'tokenizer-dsl';

const semicolonRule: Rule = {
  type: 'SEMICOLON',
  reader: semicolonReader,
};

const whitespaceReader: Rule = {
  type: 'WHITESPACE',
  reader: semicolonReader,
};

const alphaRule: Rule = {
  type: 'ALPHA',
  reader: alphaReader,
};

const numberRule: Rule = {
  type: 'NUMBER',
  reader: numberReader,
};
```

`type` is the arbitrary name of the token that the rule would read from the input string. `type` can be a string,
a number, an object, or any other data type.

`reader` is the reader that actually reads the chars from the string.

The next step is to create a tokenizer and provide it a set of rules:

```ts
const tokenize = createTokenizer([
  semicolonRule,
  whitespaceRule,
  alphaRule,
  numberRule
]);
```

`createTokenizer` would compile a highly efficient function that applies rules to read chars from the input string.

As the last step, we should call a tokenizer and provide it an input and a token handler:

```ts
import {TokenHandler} from 'tokenizer-dsl';

const handler: TokenHandler = (type, input, offset, length, context, state) => {
  console.log(type, input.substr(offset, length));
};

tokenize('123.456; aaa; +777; bbb; -42', handler);
```

The console output would be:

```
NUMBER 123.456
SEMICOLON ;
WHITESPACE  
ALPHA aaa
SEMICOLON ;
WHITESPACE  
NUMBER +777
SEMICOLON ;
WHITESPACE  
NUMBER -42
```

# Built-in readers

### `text(string, options?)`<a name="text"></a>

Reads the case-sensitive substring from the input:

```ts
// Reads 'foo'
text('foo');
```

You can optionally specify that text must be case-insensitive:

```ts
// Reads 'bar', 'BAR', 'Bar', etc.
text('bar', {caseInsensitive: true});
```

### `char(chars)`<a name="char"></a>

Reads a single char from the string. You should provide an array of strings, char codes or char ranges.

```ts
// Reads 'a', 'b', or 'c'
char(['a', 98, 99]);
```

You can specify a set of characters as a string with multiple characters:

```ts
// Reads ' ', '\t', '\r', or '\n'
char([' \t\r\n']);
```

You can specify a pair of char codes or strings that denote a char range:

```ts
// Reads [a-zA-Z]
char([['a', 'z'], [65, 90]]);
```

### `regex(pattern)`<a name="regex"></a>

Reads substring using the `RegExp` pattern:

```ts
// Reads '0', '123', etc.
regex(/0|[1-9]\d*/);
```

You don't need to specify `g` or `y` flags on the `RegExp`, these flags are automatically added if needed.

### `all(reader, options?)`<a name="all"></a>

Applies `reader` until it can read from the input:

```ts
// Reads 'abc' from 'abc123'
all(char([['a', 'z']]));
```

You can optionally specify the number of entries the `reader` must read to consider success:

```ts
// Reads at least one digit, but not more than 10
all(char([['0', '9']]), {minimumCount: 1, maximumCount: 10});
```

### `seq(...readers)`<a name="seq"></a>

Applies readers one after another sequentially:

```ts
// Reads PK-XXXXX where X is 0-9
seq(
    text('PK-'),
    all(char([['0', '9']]), {minimumCount: 5, maximumCount: 5})
);
```

### `or(...readers)`<a name="or"></a>

Returns the offset returned by the first successfully applied reader:

```ts
// Reads 'foo' or 'bar'
or(
    text('foo'),
    text('bar')
);
```

### `skip(count)`<a name="skip"></a>

Skips the given number of chars without reading:

```ts
// Skips 5 chars 
skip(5);
```

### `until(reader, options?)`<a name="until"></a>

Repeatedly applies `reader` until it successfully reads chars from the string. If `reader` failed to read chars then
returns -1.

```ts
// Reads everything until 'foo' exclusively
until(text('foo'));
```

You can make until to read inclusively:

```ts
// Reads everything until 'bar' inclusvely
until(text('bar'), {inclusive: true});
```

For example, to read all chars up to `'>'` or until the end of the input:

````ts
or(
    until(text('>'), {inclusive: true}),
    end()
);
````

### `end(offset?)`<a name="end"></a>

Skips all chars until the end of the input. You can optionally provide the offset from the input end.

```ts
end(-1);
```

### `lookahead(reader)`<a name="lookahead"></a>

This is the same as [lookahead from the regular expressions](https://www.regular-expressions.info/lookaround.html). It
returns the current offset if `reader` successfully reads chars from the input at current offset.

```ts
// Reads '<' in '<a'
seq(
    text('<'),
    lookahead(char([['a', 'z']]))
);
```

### `maybe(reader)`<a name="maybe"></a>

Returns the current offset if the `reader` failed to read chars:

```ts
// Reads 'foo-bar' and 'bar'
seq(
    maybe(text('foo-')),
    text('bar')
);
```

### `never`

The singleton reader that always returns -1.

### `none`

The singleton reader that always returns the current offset.

# Functional readers

A reader can be defined as a function that takes an `input` string, an `offset` at which it should start reading, and a
`context`. Learn more about the context in the [Context](#context) section.

A reader should return the new offset that is greater or equal to `offset` if it has successfully read from the `input`,
or any integer less than `offset` to indicate that nothing was read. If reader returns a non-number value it is treated
as an error and passed to the `error` callback of the `TokenHandler`.

Let's create a custom reader:

```ts
import {Reader} from 'tokenizer-dsl';

const fooReader: Reader = (input, offset, context) => {
  return input.startsWith('foo', offset) ? offset + 3 : -1;
};
```

This reader checks that the `input` string contains a substring `'foo'` at the `offset` and returns the new offset where
the substring ends. Or returns -1 to indicate that the reading didn't succeed.

We can combine `fooReader` with any built-in reader. For example, to read chars until `'foo'` is met:

```ts
import {until} from 'tokenizer-dsl';

// Reads until 'foo' substring is met
until(fooReader);
```

# Code-generated readers

Code generation is used to compile highly performant readers. To leverage this feature, you can define your custom
readers as a code factories.

Let's recreate the reader from the previous section with the codegen approach:

```ts
import {Reader, NO_MATCH} from 'tokenizer-dsl';

const fooReader: Reader = {

  factory(inputVar, offsetVar, contextVar, resultVar) {
    return {
      code: [
        resultVar, '=', inputVar, '.startsWith("foo",', offsetVar, ')?', offsetVar, '+3:-1;',
      ]
    };
  }
};
```

The `factory` function receives four input arguments that define the variables that should be used in the output code
template:

- `inputVar` is the variable that holds the input string.
- `offsetVar` is the variable that holds the offset in the input string from which the reader must be applied.
- `contextVar` is the variable that holds the reader context. Learn more about the context in the [Context](#context)
  section.
- `resultVar` is the variable to which the reader result must be assigned.

The `factory` function should return an object containing a `code` property that holds the code template and an optional
`bindings` property that holds the variable bindings.

To demonstrate how to use bindings, let's enhance our reader to support arbitrary strings:

```ts
import {Reader} from 'tokenizer-dsl';

function substring(str: string): Reader {
  return {

    factory(inputVar, offsetVar, contextVar, resultVar) {

      // Create a variable placeholder
      const strVar = Symbol();

      return {
        code: [
          resultVar, '=', inputVar, '.startsWith(', strVar, ',', offsetVar, ')?', offsetVar, '+', str.length, ':-1;',
        ],
        bindings: [
          // This would assign str to a strVar at runtime
          [strVar, str]
        ]
      };
    }
  };
}
```

We can combine `substring` with any built-in reader. For example, to read all sequential substrings in the input:

```ts
import {all} from 'tokenizer-dsl';

// Reads all consequent 'foo' substrings
all(substring('foo'));
```

You can introduce custom variables inside a code template. Below is an example of a reader that reads zero-or-more lower
alpha chars from the string using a `for` loop:

```ts
import {Reader} from 'tokenizer-dsl';

const lowerAlphaReader: Reader = {

  factory(inputVar, offsetVar, contextVar, resultVar) {

    // Create a variable placeholders
    const indexVar = Symbol();
    const charCodeVar = Symbol();

    return {
      code: [

        // Start reading from the offset
        'var ', indexVar, '=', offsetVar, ';',

        // Read until end of the input
        'while(', indexVar, '<', inputVar, '.length){',

        // Read the char code from the input
        'var ', charCodeVar, '=', indexVar, '.charCodeAt(', indexVar, ');',

        // Abort the loop if the char code isn't a lower alpha
        'if(', charCodeVar, '<', 'a'.charCodeAt(0), '||', charCodeVar, '>', 'z'.charCodeAt(0), ')',
        'break;',

        // Otherwise, proceed to the next char
        '++', indexVar,
        '}',

        // Return the index that was reached 
        resultVar, '=', indexVar, ';',
      ]
    };
  }
};
```

You can find out more details on how codegen works in the [codedegen](https://github.com/smikhalevski/codedegen) repo.

# Rules

Rules define how tokens are emitted when successfully read from the input by readers.

The most basic rule only declares a reader that must be used:

```ts
import {Rule} from 'tokenizer-dsl';

const fooRule: Rule = {
  reader: text('foo')
};
```

To use a rule, create a new tokenizer:

```ts
const tokenize = createTokenizer([fooRule]);
```

Now you can read inputs that consist of any number of `'foo'` substrings:

```ts
tokenize('foofoofoo', {

  token(type, input, offset, length, context) {
    // Process the token here
  }
})
```

Most of the time you have more than one token type in your input. Here the `type` property of the rule comes handy. The
value of this property would be passed to the `token` callback of the handler.

```ts
import {Rule} from 'tokenizer-dsl';

type MyTokenType = 'FOO' | 'BAR';

// You can specify token types to enhance typing
const fooRule: Rule<MyTokenType> = {
  type: 'FOO',
  reader: text('foo')
};

const barRule: Rule<MyTokenType> = {
  type: 'BAR',
  reader: text('bar')
};

const tokenize = createTokenizer([
  fooRule,
  barRule
]);

tokenize('foofoobarfoobar', {

  token(type, input, offset, length, context) {
    switch (type) {

      case 'FOO':
        // Process the FOO token here
        break;

      case 'BAR':
        // Process the BAR token here
        break;
    }
  }
})
```

## Rule stages

You can put rules on different stages to control how they are applied.

In the previous example we created a tokenizer that reads `'foo'` and `'bar'` in any order. Let's create a tokenizer
that
restricts an order in which `'foo'` and `'bar'` should be met.

```ts
import {Rule} from 'tokenizer-dsl';

type MyTokenType = 'FOO' | 'BAR';

type MyStage = 'start' | 'foo' | 'bar';

const fooRule: Rule<MyTokenType, MyStage> = {

  // Rule would be applied on stages 'start' and 'bar'
  on: ['start', 'bar'],
  type: 'FOO',
  reader: text('foo'),

  // If rule is successfully applied then tokenizer would
  // transition to the 'foo' stage
  to: 'foo'
};

const barRule: Rule<MyTokenType, MyStage> = {
  on: ['start', 'foo'],
  type: 'BAR',
  reader: text('bar'),
  to: 'bar'
};

const tokenize = createTokenizer(
    [
      fooRule,
      barRule
    ],

    // Provide the initial stage
    'start'
);
```

This tokenizer would successfully process `'foobarfoobar'` but would trigger `unrecognizedToken` for `'foofoo'`.

Rules that don't have `on` option specified are applied on all stages. To showcase this behavior, let's modify our rules
to allow `'foo'` and `'bar'` to be separated with arbitrary number of space characters.

```ts
type MyTokenType = 'FOO' | 'BAR' | 'SPACE';

type MyStage = 'start' | 'foo' | 'bar';

const fooRule: Rule<MyTokenType, MyStage> = {
  on: ['start', 'bar'],
  type: 'FOO',
  reader: text('foo'),
  to: 'foo'
};

const barRule: Rule<MyTokenType, MyStage> = {
  on: ['start', 'foo'],
  type: 'BAR',
  reader: text('bar'),
  to: 'bar'
};

// Rule would be applied on all stages: 'start', 'foo', and 'bar'
const spaceReader: Rule<MyTokenType, MyStage> = {
  type: 'SPACE',
  reader: all(char([' '])),
};

const tokenize = createTokenizer(
    [
      fooRule,
      barRule,
      spaceReader
    ],
    'start'
);
```

This tokenizer would successfully process `'foo bar foo bar'` input.

You can provide a callback that returns the next stage:

```ts
const barRule: Rule<MyTokenType, MyStage> = {
  on: ['start', 'foo'],
  type: 'BAR',
  reader: text('bar'),

  to(offset, length, context, state) {
    // Return the next stage
    return 'bar';
  }
};
```

## Silent rules

Sometimes tokens don't have any semantics that you want to process. In this case, you can mark reader as `silent` to
prevent token from being emitted.

```ts
const whitespaceRule: Rule = {
  reader: all(char([' \t\r\n'])),
  silent: true
};
```

# Streaming

Compiled tokenizer supports streaming out of the box. Let's refer to the tokenizer we defined in the [Usage](#usage)
chapter:

```ts
const tokenize = createTokenizer([
  semicolonRule,
  whitespaceRule,
  alphaRule,
  numberRule
]);
```

We used this tokenizer in a non-streaming fashion:

```ts
tokenizer('123.456; aaa; +777; bbb; -42', handler);
```

If the input string comes in chunks we can use a streaming API of the tokenizer:

```ts
import {TokenizerState} from 'tokeinzer-dsl';

let state: TokenizerState | undefined;

state = tokenizer.write('123.456', handler, state);
state = tokenizer.write('; aaa; +777; bbb; -42', handler, state);
state = tokenizer.end(handler, state);
```

`tokenizer.write` accepts an immutable state object and returns the new state object. You can inspect state to know the
stage and offset at which the tokenizer finished reading tokens.

Streaming tokenizer emits tokens that are _confirmed_. The token is confirmed after the consequent token is
successfully read or after the `tokenizer.end` is called.

# Error handling

Your custom readers may return errors to trigger `error` callback of the `TokenHandler` passed to the tokenizer. Any
non-number value returned from the reader is treated as an error.

For example, we can implement a reader that reads a quoted string from the input. If the string doesn't have the end
quote, the reader would trigger an error.

```ts
import {Reader} from 'tokenizer-dsl';

const quotedStringReader: Reader = (input, offset) => {

  // String must start with a quote char, otherwise no match
  if (input.charAt(offset) !== '"') {
    return -1;
  }

  // Search for closing quote
  const endOffset = input.indexOf('"', offset + 1);

  if (endOffset === -1) {
    // Trigger an error
    return 'Unterminated string';
  }

  return endOffset;
};
```

# Context

Tokenizer is a pure function of its state. Sometimes you want to pass your custom state to the tokenizer to your custom
readers would know what to do. You can provide the context to the tokenizer, and it would pass it to all readers as a
third argument:

```ts
import {createTokenizer, Reader} from 'tokenizer-dsl';

const fooReader: Reader = (input, offset, context) => {
  console.log(context.bar);
  return -1;
};

const tokenizer = createTokenizer([
  {reader: fooReader}
]);

tokenizer('foobar', handler, {bar: 123});
```

# Performance

[To run a performance test](./src/test/perf.js), clone this repo and run `npm ci && npm run perf` in the project
directory.

The table below shows performance comparison between tokenizer-dsl readers and `RegExp` alternatives.

Results are in millions of operations per second. The higher number is better.

| | tokenizer-dsl | `RegExp` | |
| -- | --: | --: | -- |
| [Usage example](#usage) | 5.35 | 2.54 | |
| `char(['abc'])` | 88.81 | 58.57 | `/[abc]/y` |
| `char([['a', 'z']])` | 88.12 | 58.48 | `/[a-z]/y` |
| `all(char(['abc']))` | 39.73 | 50.07 | `/[abc]*/y` |
| `all(char(['abc']), {minimumCount: 2})` | 67.13 | 50.28 | `/[abc]{2,}/y` |
| `all(text('abc'))` | 43.05 | 50.26 | `/(?:abc)*/y` |
| `or(text('abc'), text('123'))` | 67.32 | 57.19 | `/abc\|123/y` |
| `seq(text('abc'), text('123'))` | 58.86 | 54.28 | `/abc123/y` |
| `text('abc')` | 72.82 | 57.15 | `/abc/y` |
| `text('abc', {caseInsensitive: true})` | 71.17 | 55.03 | `/abc/iy` |
| `until(char(['abc']))` | 51.55 | 48.67 | `/[abc]/g` |
| `until(text('abc'))` | 51.00 | 33.06 | `/(?=abc)/g` |
| `until(text('abc'), {inclusive: true})` | 51.90 | 48.82 | `/abc/g` |

Tokenizer performance comes from following implementation aspects:

- Reader combination optimizations. For example `until(text('abc'))` would read case-sensitive characters from the sting
  until substring `'abc'` is met. An analog of this is `/(?=abc)/`. Tokenizer uses `input.indexOf('abc')` for the
  substring search, which is 2× faster than using a regular expression.

- All readers (except `regex`) rely solely on `String.prototype.charCodeAt` and `String.prototype.indexOf` methods. This
  dramatically reduces memory allocations, since no strings or other objects are created on heap.

- Tokenizer compiles provided rules into a single function. No call stack overhead.

- Rules that share the same prefix sequence of readers, read this prefix from the input only once. So chars in the input
  are accessed less frequently.
