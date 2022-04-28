import {Binding, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
import {never} from './never';
import {none} from './none';
import {NO_MATCH, Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode} from './reader-utils';
import {RegexReader} from './regex';
import {CaseSensitiveTextReader} from './text';

export interface UntilOptions {

  /**
   * If set to `true` then chars matched by `reader` are included in result.
   *
   * @default false
   */
  inclusive?: boolean;
}

/**
 * Creates a reader that reads chars until `reader` matches.
 *
 * @param reader The reader that reads chars.
 * @param options Reader options.
 */
export function until<Context = any>(reader: Reader<Context>, options: UntilOptions = {}): Reader<Context> {

  const {inclusive = false} = options;

  if (reader === never || reader === none) {
    return reader;
  }
  if (reader instanceof RegexReader) {
    return new UntilRegexReader(reader.re, inclusive);
  }
  if (reader instanceof CharCodeRangeReader) {
    const {charCodeRanges} = reader;

    if (charCodeRanges.length === 1 && typeof charCodeRanges[0] === 'number') {
      return new UntilCaseSensitiveTextReader(String.fromCharCode(charCodeRanges[0]), inclusive);
    }
    return new UntilCharCodeRangeReader(charCodeRanges, inclusive);
  }
  if (reader instanceof CaseSensitiveTextReader) {
    return new UntilCaseSensitiveTextReader(reader.str, inclusive);
  }
  return new UntilReader(reader, inclusive);
}

export class UntilCharCodeRangeReader implements ReaderCodegen {

  constructor(public charCodeRanges: CharCodeRange[], public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const inputLengthVar = createVar();
    const indexVar = createVar();
    const charCodeVar = createVar();

    return createCodeBindings([
      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      charCodeVar,
      ';',
      'while(', indexVar, '<', inputLengthVar,
      '&&(', charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, '),!(', createCharPredicateCode(charCodeVar, this.charCodeRanges), '))',
      ')++', indexVar, ';',
      resultVar, '=', indexVar, '===', inputLengthVar, '?', NO_MATCH, ':', indexVar, this.inclusive ? '+1;' : ';',
    ]);
  }
}

export class UntilCaseSensitiveTextReader implements ReaderCodegen {

  constructor(public str: string, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const strVar = createVar();
    const indexVar = createVar();

    return createCodeBindings(
        [
          'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
          resultVar, '=', indexVar, '===-1?', NO_MATCH, ':', indexVar, this.inclusive ? '+' + this.str.length : '', ';',
        ],
        [[strVar, this.str]],
    );
  }
}

export class UntilRegexReader implements ReaderCodegen {

  re;

  constructor(re: RegExp, public inclusive: boolean) {
    this.re = RegExp(re.source, re.flags.replace(/[yg]/, '') + 'g');
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const reVar = createVar();
    const arrVar = createVar();

    return createCodeBindings(
        [
          reVar, '.lastIndex=', offsetVar, ';',
          'var ', arrVar, '=', reVar, '.exec(', inputVar, ');',
          resultVar, '=', arrVar, '===null?', NO_MATCH, ':', this.inclusive ? [reVar, '.lastIndex'] : [arrVar, '.index'], ';',
        ],
        [[reVar, this.re]],
    );
  }
}

export class UntilReader<Context> implements ReaderCodegen {

  constructor(public reader: Reader<Context>, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const bindings: Binding[] = [];
    const inputLengthVar = createVar();
    const indexVar = createVar();
    const readerResultVar = createVar();

    return createCodeBindings(
        [
          'var ',
          inputLengthVar, '=', inputVar, '.length,',
          indexVar, '=', offsetVar, ',',
          readerResultVar, '=', NO_MATCH, ';',
          'while(', indexVar, '<', inputLengthVar, '&&', readerResultVar, '===', NO_MATCH, '){',
          createReaderCallCode(this.reader, inputVar, indexVar, contextVar, readerResultVar, bindings),
          '++', indexVar,
          '}',
          resultVar, '=', readerResultVar, '>=0?', this.inclusive ? readerResultVar : [indexVar, '-1'], ':', readerResultVar, ';',
        ],
        bindings,
    );
  }
}
