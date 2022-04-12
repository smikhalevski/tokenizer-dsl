# tokenizer-dsl [![build](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml)

DSL for building streaming tokenizers.

⚠️ [API documentation is available here.](https://smikhalevski.github.io/tokenizer-dsl/)

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
