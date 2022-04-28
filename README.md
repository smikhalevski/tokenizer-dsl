# tokenizer-dsl [![build](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml)

The general-purpose lexer and the DSL for assembling tokenization rules.

- [2–3× faster than `RegExp`](#performance);
- Less than [4 kB gzipped](https://bundlephobia.com/result?p=tokenizer-dsl) including dependencies;
- High-level API.

```shell
npm install --save-prod tokenizer-dsl
```

- [Overview](#overview)
- [Usage](#usage)
- [Readers](#readers)
    - [Built-in readers](#built-in-readers)
    - [Functional readers](#functional-readers)
    - [Code-generated readers](#code-generated-readers)
- [Rules](#rules)
    - [Rule stages](#rule-stages)
    - [Silent rules](#silent-rules)
- [Context](#context)
- [Streaming tokenizer](#streaming-tokenizer)
- [Performance](#performance)

# Overview

This library provides a way to describe rules and create a tokenizer.

The extensive example below shows how to assemble readers to create a stateless tokenizer that would read a list of
floating-point numbers separated by a semicolon. And then pass the input to the tokenizer in a streaming fashion.

```ts
import {all, char, createTokenizer, maybe, or, seq, text, TokenHandler} from 'tokenizer-dsl';

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
            digitsReader,
        ),
    ),

    // fraction
    maybe(
        seq(
            dotReader,
            maybe(digitsReader),
        ),
    ),
);

const semicolonReader = text(';');

const whitespaceReader = all(char([' \t\r\n']));

const tokenizer = createTokenizer<'NUMBER', 'value' | 'separator'>(
    [
      {
        on: ['value'],
        type: 'NUMBER',
        reader: numberReader,
        to: 'separator'
      },
      {
        on: ['separator'],
        reader: semicolonReader,
        silent: true,
        to: 'value'
      },
      {
        reader: whitespaceReader,
        silent: true
      }
    ],
    'value'
);

const handler: TokenHandler = {

  token(type, offset, length, context, state) {
    console.log(type, state.chunk.substr(offset - state.chunkOffset, length), 'at position', offset)
  },

  unrecognizedToken(offset, context, state) {
    console.log('Unrecognized token at position', offset)
  }
};

const state = tokenizer.write('123', handler);

tokenizer.write('.456; +', handler, state);
tokenizer.write('777; 42', handler, state);

tokenizer.end(handler, state);
```

The console output would be:

```
NUMBER 123.456 at position 0
NUMBER +777 at position 9
NUMBER 42 at position 15
```

# Usage

Let's consider the input string that contains lowercase-alpha strings and unsigned integers separated by a semicolon:

```
foo;123;bar;456
```

First we need to describe [readers](#readers) that would read chars from the input string.

To read a lowercase-alpha string we would use the following reader:

```ts
import {all, char} from 'tokenizer-dsl';

const alphaReader = all(char([['a', 'z']]), {minimumCount: 1});
```

The reader works exactly as the regular expression `/[a-z]+/y`.

To read a number we need a more complex reader.

```ts
import {all, char, or, seq, text} from 'tokenizer-dsl';

const integerReader = or(
    text('0'),
    seq(
        char([['1', '9']]),
        all(char([['0', '9']]))
    )
);
```

The reader above would read a single "0" char or any char from "1" to "9" followed by a digit char. This reader works
the same way as `/0|[1-9]\d*/y`.

To read a semicolon char we would use this simple reader:

```ts
import {text} from 'tokenizer-dsl';

const semicolonReader = text(';');
```

Now when we defined all required readers, we can define the [tokenization rules](#rules):

```ts
import {Rule} from 'tokenizer-dsl';

const alphaRule: Rule = {
  type: 'ALPHA',
  reader: alphaReader,
};

const integerRule: Rule = {
  type: 'INTEGER',
  reader: integerReader,
};

const semicolonRule: Rule = {
  type: 'SEMICOLON',
  reader: semicolonReader,
};
```

`type` is the name of the token that this rule would read from the input string.

`reader` is the reader that actually reads the chars from the string.

The next step is to create a tokenizer and provide it a set of rules:

```ts
const tokenize = createTokenizer([
  alphaRule,
  integerRule,
  semicolonRule
]);
```

`createTokenizer` would compile a highly efficient function that applies rules to read chars from the string.

As the last step, we should call a tokenizer and provide it an input and a token handler:

```ts
import {TokenHandler} from 'tokenizer-dsl';

const handler: TokenHandler = {

  token(type, offset, length, context) {
    console.log(type, input.substr(offset, length), 'at position', offset);
  }
};

tokenize('foo;123;bar;456', handler);
```

The console output would be:

```
ALPHA foo at position 0
SEMICOLON ; at position 3
INTEGER 123 at position 4
SEMICOLON ; at position 7
ALPHA bar at position 8
SEMICOLON ; at position 11
INTEGER 456 at position 12
```

To capture unrecognized tokens you can add an `unrecognizedToken` callback to the handler:

```ts
const handler: TokenHandler = {

  token(type, offset, length, context) {
    console.log(type, input.substr(offset, length), 'at position', offset);
  },

  unrecognizedToken(offset, context) {
    console.log('Unrecognized token at position', offset);
  }
};
```

Let's test it with a malformed input. Notice the "_" char that isn't recognized by tokenization rules that we defined:

```ts
tokenize('abc_', handler);
```

The console output would be:

```
ALPHA abc at position 0
Unrecognized token at position 4
```

# Readers

To read characters from the input string, this library uses a concept of readers. A reader can be defined as
a [function](#functional-readers) or as a [code-generating factory](#code-generated-readers).

Most of the time you won't need to write your own readers and since you can use a rich set of built-in reader factories.

## Built-in readers

### `text(string, options?)`

Reads the case-sensitive substring from the input:

```ts
// Reads "foo"
const fooReader = text('foo');
```

You can optionally specify that text must be case-insensitive:

```ts
// Reads "bar", "BAR", "Bar", etc.
const barReader = text('bar', {caseInsensitive: true});
```

### `char(chars)`

Reads a single char from the string. You should provide an array of strings, char codes or char ranges.

```ts
// Reads "a", "b", or "c"
const abReader = char(['a', 98, 99]);
```

You can specify a set of characters as a string with multiple characters:

```ts
// Reads " ", "\t", "\r", or "\n"
const whitespaceReader = char([' \t\r\n']);
```

You can specify a pair of char codes or strings that denote a char range:

```ts
// Reads [a-zA-Z]
const alphaReader = char([['a', 'z'], [65, 90]]);
```

### `regex(pattern)`

Reads substring using the `RegExp` pattern:

```ts
// Reads "0", "123", etc.
const integerReader = regex(/0|[1-9]\d*/);
```

You don't need to specify `g` or `y` flags on the `RegExp`, these flags are automatically added if needed.

### `all(reader, options?)`

Applies `reader` until it can read from the input:

```ts
// Reads "abc" from "abc123"
const lowerAlphaReader = all(char([['a', 'z']]));
```

You can optionally specify the number of entries the `reader` must read to consider success:

```ts
// Reads at least one digit, but not more than 10
const digitsReader = all(char([['0', '9']]), {minimumCount: 1, maximumCount: 10});
```

### `seq(...readers)`

Describes a sequence of readers that must be applied one after another:

```ts
// Reads PK-XXXXX where X is a digit
const pkReader = seq(
    text('PK-'),
    all(char([['0', '9']]), {minimumCount: 5, maximumCount: 5})
);
```

### `or(...readers)`

Returns the offset returned by the first successfully applied reader:

```ts
// Reads "foo" or "bar"
const fooOrBarReader = or(
    text('foo'),
    text('bar')
);
```

### `skip(count)`

Skips the given number of chars:

```ts
// Reads 5 arbitrary chars 
const skip5Reader = skip(5);
```

### `until(reader, options?)`

Reads until the `reader` is successfully reads chars from the string. If `reader` failed to read chars in the input
then `until` returns `NO_MATCH`.

```ts
// Reads everything until "foo" exclusively
const untilFooReader = until(text('foo'));
```

You can make until to read inclusively:

```ts
// Reads everything until "bar" inclusvely
const untilBarReader = until(text('bar'), {inclusive: true});
```

For example, to read all chars up to ">" or until the end of the input:

````ts
const untilGtReader = or(
    until(text('>'), {inclusive: true}),
    end()
);
````

### `end(offset?)`

Reads all character until the end of the input. You can optionally provide the offset from the input end.

```ts
const upToLastCharReader = end(-1);
```

### `lookahead(reader)`

This is the same as [lookahead from the regular expressions](https://www.regular-expressions.info/lookaround.html). It
returns the current offset if `reader` successfully reads chars from the input at current offset.

```ts
// Reads "<" from "<a"
const startTagReader = seq(
    text('<'),
    lookahead(char([['a', 'z']]))
)
```

### `maybe(reader)`

Returns the current offset if the `reader` failed to read chars:

```ts
// Reads "foo-bar" and "bar"
const fooBarReader = seq(
    maybe(text('foo-')),
    text('bar')
)
```

### `never`

The singleton reader that always returns `NO_MATCH`.

### `none`

The singleton reader that always returns the current offset.

## Functional readers

A reader can be defined as a function that takes an `input` string, an `offset` at which it should start reading, and a
`context`. A reader should return a new offset in the `input` (a non-negative integer) or a result code (a negative
integer). Learn more about the context in the [Context](#context) section.

This library defines only one result code `NO_MATCH` with value -1. When the reader returns this code it signals the
tokenizer that it tries to read chars from the input string, but they didn't meet the expectation.

Let's create a custom reader:

```ts
import {Reader, NO_MATCH} from 'tokenizer-dsl';

const fooReader: Reader = (input, offset, context) => {
  return input.startsWith('foo', offset) ? offset + 4 : NO_MATCH;
};
```

This reader checks that the `input` string contains a substring "foo" at the `offset` and returns the new offset where
the substring ends. Or returns a `NO_MATCH` result code indicating that the expectation wasn't met.

We can use `fooReader` reader along with any other readers. For example, to read chars until "foo" is met:

```ts
import {until} from 'tokenizer-dsl';

const untilFooReader = until(fooReader);
```

## Code-generated readers

This library relies on code generation to create a highly performant readers. To leverage this feature, you can define
your custom readers as a code factories.

Let's recreate the reader from the previous section with the codegen approach:

```ts
import {Reader, NO_MATCH} from 'tokenizer-dsl';

const fooReader: Reader = {

  factory(inputVar, offsetVar, contextVar, resultVar) {
    return {
      code: [
        resultVar, '=', inputVar, '.startsWith("foo",', offsetVar, ')?', offsetVar, '+1:', NO_MATCH, ';',
      ]
    };
  }
}
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
import {Reader, NO_MATCH} from 'tokenizer-dsl';

function substring(str: string): Reader {
  return {

    factory(inputVar, offsetVar, contextVar, resultVar) {

      // Create a variable placeholder
      const strVar = Symbol();

      return {
        code: [
          resultVar, '=', inputVar, '.startsWith(', strVar, ',', offsetVar, ')?', offsetVar, '+1:', NO_MATCH, ';',
        ],
        bindings: [
          // Assign str to a strVar at runtime
          [strVar, str]
        ]
      };
    }
  };
}
```

We can use `substring` reader along with any other readers. For example, to read all sequential substrings in the input:

```ts
import {all} from 'tokenizer-dsl';

const allFooReader = all(substring('foo'));
```

You can introduce custom variables inside a code template. Below is an example of a reader that reads lower all alpha
chars from the string using a `for` loop:

```ts
import {Reader, NO_MATCH} from 'tokenizer-dsl';

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
        'if(', charCodeVar, '<97||', charCodeVar, '>122)break;',

        // Otherwise, proceed to the next char
        indexVar, '++',
        '}',

        // Return the index that was reached 
        resultVar, '=', indexVar, ';',
      ]
    };
  }
};
```

You can find out more details on how codegen in the [codedegen](https://github.com/smikhalevski/codedegen) repo.

# Rules

Rules define how tokens are emitted when successfully read from the input.

The most basic rule defines a reader only:

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

Now you can read inputs that consist of any number of "foo" substrings:

```ts
tokenize('foofoofoo', {

  token(type, offset, length, context) {
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

  token(type, offset, length, context) {
    // type is MyTokenType
  }
})
```

## Rule stages

You can put rules on different stages to control how they are applied.

In the previous example we created a tokenizer that reads "foo" and "bar" in any order. Let's create a tokenizer that
restricts an order in which "foo" and "bar" should be met.

```ts
import {Rule} from 'tokenizer-dsl';

type MyTokenType = 'FOO' | 'BAR';

type MyStage = 'start' | 'foo' | 'bar';

const fooRule: Rule<MyTokenType, MyStage> = {

  // Rule would be applied on stages "start" and "bar"
  on: ['start', 'bar'],
  type: 'FOO',
  reader: text('foo'),

  // If rule is successfully applied then tokenizer would
  // transition to the "foo" stage
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

This tokenizer would successfully process "foobarfoobar" but would trigger `unrecognizedToken` for "foofoo".

Rules that don't have `on` stages specified are applied on all stages. To showcase this behavior, let's modify our rules
to allow "foo" and "bar" to be separated with arbitrary number of space characters.

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

// Rule would be applied on all stages: "start", "foo", and "bar"
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

This tokenizer would successfully process "foo··bar··foo··bar" input (space characters are shown as "·").

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

# Context

Context is a value that tokenizer passes to all readers and dyn

# Streaming tokenizer

# Performance

[To run a performance test](./src/test/perf.js), clone this repo and run `npm ci && npm run perf` in the project
directory.

The table below shows performance comparison between tokenizer-dsl readers and `RegExp` alternatives.

Results are in millions of operations per second. The higher number is better.

| | tokenizer-dsl | `RegExp` | |
| -- | --: | --: | -- |
| [Usage example](#usage) | 8.69 | 3.27 | |
| `char(['abc'])` | 92.81 | 34.57 | `/[abc]/y` |
| `char([['a', 'z']])` | 90.81 | 34.48 | `/[a-z]/y` |
| `all(char(['abc']))` | 40.73 | 28.07 | `/[abc]*/y` |
| `all(char(['abc']), {minimumCount: 2})` | 56.13 | 29.28 | `/[abc]{2,}/y` |
| `all(text('abc'))` | 51.05 | 28.26 | `/(?:abc)*/y` |
| `all(regex(/abc/))` | 26.01 | 28.93 | `/(?:abc)*/y` |
| `or(text('abc'), text('123'))` | 66.32 | 31.19 | `/abc\|123/y` |
| `seq(text('abc'), text('123'))` | 58.86 | 30.28 | `/abc123/y` |
| `text('abc')` | 71.82 | 31.15 | `/abc/y` |
| `text('abc', {caseInsensitive: true})` | 71.17 | 31.03 | `/abc/iy` |
| `until(char(['abc']))` | 50.55 | 31.67 | `/[abc]/g` |
| `until(text('abc'))` | 51.00 | 25.06 | `/(?=abc)/g` |
| `until(text('abc'), {inclusive: true})` | 50.90 | 26.82 | `/abc/g` |
| `until(regex(/abc/))` | 24.97 | 26.78 | `/(?=abc)/g` |

Tokenizer performance comes from following implementation aspects:

- Reader combination optimizations. For example `until(text('abc'))` would read case-sensitive characters from the sting
  until substring "foo" is met. An analog of this is `/(?=abc)/`. Tokenizer uses `input.indexOf('abc')` for this the
  substring search, which is up to 3× faster than using a regular expression.

- All readers (except `regex`) rely solely on `charCodeAt` and `indexOf` methods. This dramatically reduces memory
  allocations, since no strings or other objects are created on heap.

- Tokenizer compiles provided rules into a single function. No call stack overhead.

- Rules that share the same prefix sequence of readers do read this prefix from the input only once. Chars in the string
  are accessed less frequently.

