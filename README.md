# tokenizer-dsl [![build](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml)

DSL for building streaming tokenizers.

⚠️ [API documentation is available here.](https://smikhalevski.github.io/tokenizer-dsl/)

Example below shows how to assemble takers to create tokenizer for numbers:

```ts
import {all, char, maybe, text, or, seq} from 'tokenizer-dsl';

const zeroTaker = text('0');

const leadingDigitTaker = char((charCode) => charCode >= 49 /*1*/ && charCode <= 57 /*9*/);

const digitsTaker = all(char((charCode) => charCode >= 48 /*0*/ && charCode <= 57 /*9*/));

const dotTaker = text('.');

const signTaker = char((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

const numberTaker = seq(

    // sign
    maybe(signTaker),

    // integer
    or(
        zeroTaker,
        seq(
            leadingDigitTaker,
            digitsTaker,
        ),
    ),

    // fraction
    maybe(
        seq(
            dotTaker,
            maybe(digitsTaker),
        ),
    ),
);
```

To get the offset at which the number ends in the string call `numberTaker` and provide an `input` string, and
an `offset` from which the reading should be started:

```ts
numberTaker.take(/*input*/ '0', /*offset*/ 0); // → 1

numberTaker.take(/*input*/ '123', /*offset*/ 0); // → 3

numberTaker.take(/*input*/ '+123', /*offset*/ 0); // → 4

numberTaker.take(/*input*/ '-0.123', /*offset*/ 0); // → 6

numberTaker.take(/*input*/ '-123.123', /*offset*/ 0); // → 8

numberTaker.take(/*input*/ 'aaa123bbb', /*offset*/ 3);
  // → 6, because valid number starts at offset 3 and ends at 6
```

If `input` string doesn't contain a valid number at an `offset` then `ResultCode.NO_MATCH === -1` is returned:

```ts
numberTaker.take(/*input*/ 'aaa', /*offset*/ 0); // → -1

numberTaker.take(/*input*/ 'a123', /*offset*/ 0); // → -1

numberTaker.take(/*input*/ '0000', /*offset*/ 0);
  // → 1, because valid number starts at 0 and ends at 1 
```
