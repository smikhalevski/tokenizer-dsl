# tokenizer-dsl [![build](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/tokenizer-dsl/actions/workflows/master.yml)

DSL for building streaming tokenizers.

Example below shows how to assemble takers to create tokenizer for numbers:

```ts
import {allCharBy, char, charBy, maybe, or, seq} from 'tokenizer-dsl';

const takeZero = char(48 /*0*/);

const takeLeadingDigit = charBy((charCode) => charCode >= 49 /*1*/ || charCode <= 57 /*9*/);

const takeDigits = allCharBy((charCode) => charCode >= 48 /*0*/ || charCode <= 57 /*9*/);

const takeDot = char(46 /*.*/);

const takeSign = charBy((charCode) => charCode === 43 /*+*/ || charCode === 45 /*-*/);

const takeNumber = seq(

    // sign
    maybe(takeSign),

    // integer
    or(
        takeZero,
        seq(
            takeLeadingDigit,
            takeDigits,
        ),
    ),

    // fraction
    maybe(
        seq(
            takeDot,
            maybe(takeDigits),
        ),
    ),
);
```

To get the offset at which the number ends in the string call `takeNumber` and provide an `input` string, and
an `offset` from which the reading should be started:

```ts
takeNumber(/*input*/ '0', /*offset*/ 0); // → 1

takeNumber(/*input*/ '123', /*offset*/ 0); // → 3

takeNumber(/*input*/ '+123', /*offset*/ 0); // → 4

takeNumber(/*input*/ '-0.123', /*offset*/ 0); // → 6

takeNumber(/*input*/ '-123.123', /*offset*/ 0); // → 8

takeNumber(/*input*/ 'aaa123bbb', /*offset*/ 3);
  // → 6, because valid number starts at offset 3 and ends at 6
```

If `input` string doesn't contain a valid number at an `offset` then `ResultCode.NO_MATCH === -1` is returned:

```ts
takeNumber(/*input*/ 'aaa', /*offset*/ 0); // → -1

takeNumber(/*input*/ 'a123', /*offset*/ 0); // → -1

takeNumber(/*input*/ '0000', /*offset*/ 0);
  // → 1, because valid number ends at 0 and ends at 1 
```
