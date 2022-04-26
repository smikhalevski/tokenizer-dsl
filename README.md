# tokenizer-dsl [![build](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml)

The general-purpose lexer and the DSL for assembling tokenization rules.

- [3× faster than `RegExp`](#performance);
- Less than [4 kB gzipped](https://bundlephobia.com/result?p=tokenizer-dsl) including dependencies;
- High-level API.

```shell
npm install --save-prod tokenizer-dsl
```

# Usage

This library provides a way to describe rules and create a tokenizer.

Let's consider the input string that contains lowercase-alpha strings and unsigned integers separated by a semicolon:

```
abcd;1234;efgh;5678
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

`type` is the name of the token that this rule would read from the input string. `reader` is the reader that actually
reads the chars from the string.

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

  token(type, offset, length) {
    console.log(type, input.substr(offset, length), 'at', offset);
  }
};

tokenize('abcd;1234;efgh;5678', handler);
```

The console output would be:

```
ALPHA abcd at 0
SEMICOLON ; at 4
INTEGER 1234 at 5
SEMICOLON ; at 9
ALPHA efgh at 10
SEMICOLON ; at 14
INTEGER 5678 at 15
```

To capture unrecognized tokens you can add an `unrecognizedToken` callback to the handler:

```ts
const handler: TokenHandler = {

  token(type, offset, length) {
    console.log(type, input.substr(offset, length), 'at', offset);
  },

  unrecognizedToken(offset) {
    console.log('Unrecognized token at', offset);
  }
};
```

Let's test it with a malformed input. Notice the "_" char that isn't recognized by tokenization rules that we defined:

```
tokenize('abcd_', handler);
```

The console output would be:

```
ALPHA abcd at 0
Unrecognized token at 4
```

# Readers

## Reader optimizations

## Custom readers

## Context

# Rules

## Rule stages

## Silent rules

## Rule optimizations

# Streaming

# Performance

Tokenizer performance comes from following implementation aspects

- reader combination optimizations
- All readers (except regex()) rely only on charCodeAt, indexOf. This dramatically reduces memory allocations, since no
  substrings or other objects are created.
- Tokenizer compiles all rules into a single function. No call stack overhead.
- Rules that share the same prefix sequence of readers do read prefix from the input only once. Chars in the string are
  accessed less frequently.

For example until(text('foo')) would read case-sensitive characters from the sting until substring "foo" is met. A regex
analog of this is input.match(/^.*?(?=foo)/). But on the other hand, this is the same as input.indexOf('foo') which is
10x faster.

Tokenizer uses rules to read tokens from the input. Rules use readers that read characters from the string.

Example below shows how to assemble readers to create tokenizer for numbers:

```ts
import {all, char, maybe, text, or, seq} from 'tokenizer-dsl';

const readZero = text('0');

const readLeadingDigit = char((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

const readDigits = all(char((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/));

const readDot = text('.');

const readSign = char((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

const readNumber = seq(
    // sign
    maybe(readSign),

    // integer
    or(
        readZero,
        seq(
            readLeadingDigit,
            readDigits,
        ),
    ),

    // fraction
    maybe(
        seq(
            readDot,
            maybe(readDigits),
        ),
    ),
);
```

To get the offset at which the number ends in the string call `readNumber` and provide an `input` string, and
an `offset` from which the reading should be started:

```ts
readNumber(/*input*/ '0', /*offset*/ 0); // → 1

readNumber(/*input*/ '123', /*offset*/ 0); // → 3

readNumber(/*input*/ '+123', /*offset*/ 0); // → 4

readNumber(/*input*/ '-0.123', /*offset*/ 0); // → 6

readNumber(/*input*/ '-123.123', /*offset*/ 0); // → 8

readNumber(/*input*/ 'aaa123bbb', /*offset*/ 3);
// → 6, because valid number starts at offset 3 and ends at 6
```

If `input` string doesn't contain a valid number at an `offset` then `NO_MATCH === -1` is returned:

```ts
readNumber(/*input*/ 'aaa', /*offset*/ 0); // → -1

readNumber(/*input*/ 'a123', /*offset*/ 0); // → -1

readNumber(/*input*/ '0000', /*offset*/ 0);
// → 1, because valid number starts at 0 and ends at 1 
```
