import {Binding, CodeBindings, createVar, Var} from 'codedegen';
import {CharCodeRange, CharCodeRangeReader, createCharPredicateCode} from './char';
import {never} from './never';
import {none} from './none';
import {Reader, ReaderCodegen} from './reader-types';
import {createCodeBindings, createReaderCallCode, NO_MATCH} from './reader-utils';
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
 *
 * @template Context The context passed by tokenizer.
 */
export function until<Context = any, Error = never>(reader: Reader<Context, Error>, options: UntilOptions = {}): Reader<Context, Error> {

  const {inclusive = false} = options;

  if (reader === never || reader === none) {
    return reader;
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
      resultVar, '=', NO_MATCH, ';',

      'var ',
      inputLengthVar, '=', inputVar, '.length,',
      indexVar, '=', offsetVar, ',',
      charCodeVar, ';',

      'do{',
      'if(', indexVar, '>=', inputLengthVar, ')break;',
      charCodeVar, '=', inputVar, '.charCodeAt(', indexVar, ');',
      'if(', createCharPredicateCode(charCodeVar, this.charCodeRanges), '){', resultVar, '=', indexVar, this.inclusive ? '+1' : '', ';break}',
      '++', indexVar, ';',
      '}while(true)',
    ]);
  }
}

export class UntilCaseSensitiveTextReader implements ReaderCodegen {

  constructor(public str: string, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {
    const {str} = this;

    const strVar = createVar();
    const indexVar = createVar();

    return createCodeBindings(
        [
          'var ', indexVar, '=', inputVar, '.indexOf(', strVar, ',', offsetVar, ');',
          resultVar, '=', indexVar, this.inclusive ? ['===-1?', NO_MATCH, ':', indexVar, '+', str.length] : '', ';',
        ],
        [[strVar, str]],
    );
  }
}

export class UntilReader<Context, Error> implements ReaderCodegen {

  constructor(public reader: Reader<Context, Error>, public inclusive: boolean) {
  }

  factory(inputVar: Var, offsetVar: Var, contextVar: Var, resultVar: Var): CodeBindings {

    const indexVar = createVar();
    const readerResultVar = createVar();
    const bindings: Binding[] = [];

    return createCodeBindings(
        [
          resultVar, '=', NO_MATCH, ';',

          'var ',
          indexVar, '=', offsetVar, ',',
          readerResultVar, ';',

          'do{',
          createReaderCallCode(this.reader, inputVar, indexVar, contextVar, readerResultVar, bindings),
          'if(typeof ', readerResultVar, '!=="number"){', resultVar, '=', readerResultVar, ';break}',
          'if(', readerResultVar, '>=', indexVar, '){', resultVar, '=', this.inclusive ? readerResultVar : indexVar, ';break}',
          '++', indexVar, ';',
          '}while(true)',
        ],
        bindings,
    );
  }
}
