import {Code, createVar, toTaker, Var} from './code';
import {ResultCode, Taker, TakerLike} from './taker-types';
import {isTakerCodegen} from './taker-utils';

/**
 * The strategy of token confirmation.
 */
export const enum TokenConfirmationMode {

  /**
   * Next token must be read before the current token is emitted.
   */
  ALWAYS = 'always',

  /**
   * Token is emitted as soon as it is read.
   */
  NEVER = 'never',

  /**
   * Next token must be read before the current token is emitted during streaming. Otherwise, token is emitted as soon
   * as it is read.
   */
  STREAMING = 'streaming',
}

/**
 * Defines how tokens are read from the input string.
 */
export interface TokenReader extends TokenReaderOptions {

  /**
   * The taker that takes chars from the string.
   */
  taker: Taker;
}

/**
 * The options of the token reader.
 */
export interface TokenReaderOptions {

  /**
   * The list of stages at which reader can be used. If omitted then reader is used on all stages. If an empty array
   * then reader is never used.
   *
   * @default undefined
   */
  stages?: unknown[] | undefined;

  /**
   * The stage which should be used for next reader if this reader has successfully read the token.
   *
   * If `undefined` the next stage is set to the current stage.
   *
   * @default undefined
   */
  nextStage?: unknown;

  /**
   * Defines if the token should be emitted only after the consequent token was read.
   *
   * @default TokenConfirmationMode.STREAMING
   */
  confirmationMode?: TokenConfirmationMode;
}

/**
 * Creates the new token reader.
 *
 * @param taker The taker that takes chars from the string.
 * @param options Other options.
 * @returns The {@link TokenReader} instance.
 */
export function createTokenReader(taker: TakerLike, options?: TokenReaderOptions): TokenReader {
  return {
    taker: toTaker(taker),
    stages: options?.stages,
    nextStage: options?.nextStage,
    confirmationMode: options?.confirmationMode,
  };
}

/**
 * The handler that is invoked when tokenizer state is changed.
 */
export interface TokenHandler {

  /**
   * Triggered when the reader has successfully read the token from the input string.
   *
   * @param reader The reader that read the token.
   * @param startOffset The offset in the input string where the token starts.
   * @param endOffset The offset in the input string where the token ends.
   */
  token(reader: TokenReader, startOffset: number, endOffset: number): void;

  /**
   * Triggered if taker returned an error code.
   *
   * @param reader The reader that failed to read the token.
   * @param offset The offset in the input string where the token starts.
   * @param errorCode The error code.
   */
  error(reader: TokenReader, offset: number, errorCode: number): void;

  /**
   * Triggered if there were no readers that could handle the token at the given offset.
   *
   * @param offset The offset in the input string where the token should have started.
   */
  unrecognizedToken(offset: number): void;
}

export function createTokenizerCallback(readers: TokenReader[]): (handler: TokenHandler) => void {

  const uniqueStages = readers.reduce<unknown[]>((stages, reader) => {
    reader.stages?.forEach((stage) => {
      if (stages.indexOf(stage) === -1) {
        stages.push(stage);
      }
    });
    return stages;
  }, []);

  const handlerVar = createVar();

  const stageVar = createVar();
  const tokenCallbackVar = createVar();
  const errorCallbackVar = createVar();
  const unrecognizedTokenCallbackVar = createVar();

  const prevReaderVar = createVar();
  const prevOffsetVar = createVar();

  const inputVar = createVar();
  const offsetVar = createVar();

  const values: [Var, unknown][] = [];

  const code: Code = [
    'var ',
    stageVar, '=this.stage,',
    prevReaderVar, '=this.prevReaderVar,',
    prevOffsetVar, '=this.prevOffsetVar,',
    tokenCallbackVar, '=', handlerVar, '.token,',
    errorCallbackVar, '=', handlerVar, '.error,',
    unrecognizedTokenCallbackVar, '=', handlerVar, '.unrecognizedToken;',

    'while(', offsetVar, '<', inputVar, '.length){',
    readers.map((reader) => {

      const {taker, stages} = reader;

      if (stages?.length === 0) {
        // Reader is never used
        return '';
      }

      const readerVar = createVar();
      const takerVar = createVar();
      const takerResultVar = createVar();

      values.push([readerVar, reader]);

      if (isTakerCodegen(taker)) {
        values.push([takerVar, taker]);
      }

      return [
        // Check if reader can be applied on the current stage
        stages ? ['if(', stages.map((stage) => [stageVar, '===', uniqueStages.indexOf(stage)]), '){'] : '',

        // Take chars from the input string
        'var ', takerResultVar, ';',
        isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', inputVar, ',', offsetVar, ');'],

        'if(', takerResultVar, '!==' + ResultCode.NO_MATCH + '){',

        // Taker error
        'if(', takerResultVar, '<0){',
        errorCallbackVar, '(', readerVar, ',', offsetVar, ',', takerResultVar, ');',
        'return}',

        reader.nextStage === undefined ? '' : [stageVar, '=this.stage=', uniqueStages.indexOf(reader.nextStage), ';'],
        'this.offset=', takerResultVar, ';',

        // Emit confirmed token
        'if(', prevReaderVar, '){',
        'this.prevReader=undefined;',
        'this.prevOffset=-1;',
        tokenCallbackVar, '(', prevReaderVar, ',', prevOffsetVar, ',', offsetVar, ');',
        prevReaderVar, '=undefined;',
        prevOffsetVar, '=-1',
        '}',

        // Emit token
        reader.confirmationMode === TokenConfirmationMode.NEVER ? [
          // Call reader immediately
          tokenCallbackVar, '(', readerVar, ',', offsetVar, ',', takerResultVar, ');',
        ] : [
          // Defer reader call
          prevReaderVar, '=this.prevReader=', readerVar, ';',
          prevOffsetVar, '=this.prevOffset=', offsetVar, ';',
        ],

        offsetVar, '=', takerResultVar, ';',

        'continue}',
        stages ? '}' : '',
      ];
    }),
    // No readers matched
    unrecognizedTokenCallbackVar, '(', offsetVar, ');',
    'break}'
  ];

  return () => {
  };
}
