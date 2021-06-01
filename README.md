# tokenizer-dsl

DSL for taker-based string tokenizers.

Example below shows how to assemble takers to create tokenizer for numbers:

```ts
const takeZero = char(48 /*0*/);

const takeLeadingDigit = charBy((charCode) => charCode >= 49 /*1*/ || charCode <= 57 /*9*/);

const takeDigit = charBy((charCode) => charCode >= 48 /*0*/ || charCode <= 57 /*9*/);

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
            all(takeDigit),
        ),
    ),

    // fraction
    maybe(
        seq(
            takeDot,
            maybe(all(takeDigit)),
        ),
    ),
);
```

To read the number from string:

```ts
takeNumber(/*input*/ '0', /*offset*/ 0); // → 1

takeNumber(/*input*/ '123', /*offset*/ 0); // → 3

takeNumber(/*input*/ '+123', /*offset*/ 0); // → 4

takeNumber(/*input*/ '-0.123', /*offset*/ 0); // → 6

takeNumber(/*input*/ '-123.123', /*offset*/ 0); // → 8

takeNumber(/*input*/ 'aaa123bbb', /*offset*/ 3);
  // → 6, because valid number starts at offset 3 and ends at 6
```

If string doesn't contain the number at offset then `ResultCode.NO_MATCH === -1` is returned:

```ts
takeNumber(/*input*/ 'aaa', /*offset*/ 0); // → -1

takeNumber(/*input*/ 'a123', /*offset*/ 0); // → -1

takeNumber(/*input*/ '0000', /*offset*/ 0);
  // → 1, because valid number ends at offset 1 
```
