import {Binding, Code, compileFunction, createVar, toTaker} from './code';
import {ResultCode, Taker, TakerLike} from './taker-types';
import {isTakerCodegen} from './taker-utils';

/**
 * Defines how tokens are read from the input string.
 */
export interface Token extends TokenOptions {

  /**
   * The taker that takes chars from the string.
   */
  taker: Taker;
}

/**
 * The options of the token reader.
 */
export interface TokenOptions {

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
}

/**
 * Creates the new token reader.
 *
 * @param taker The taker that takes chars from the string.
 * @param options Other options.
 * @returns The {@link Token} instance.
 */
export function createToken(taker: TakerLike, options?: TokenOptions): Token {
  return {
    taker: toTaker(taker),
    stages: options?.stages,
    nextStage: options?.nextStage,
  };
}

export interface TokenIteratorState {

  /**
   * The current tokenizer stage.
   */
  stage: unknown;

  /**
   * The chunk that is being processed.
   */
  chunk: string;

  /**
   * The offset in the {@link chunk} from which the tokenization should proceed.
   */
  offset: number;

  /**
   * The offset of the {@link chunk} in the stream.
   */
  chunkOffset: number;
}

export type TokenHandler = (reader: Token, offset: number, result: number) => void;

export type TokenIterator = (state: TokenIteratorState, streaming: boolean, handler: TokenHandler) => void;

export function createTokenIterator(readers: Token[]): TokenIterator {

  const uniqueStages = readers.reduce<unknown[]>((stages, reader) => {
    reader.stages?.forEach((stage) => {
      if (stages.indexOf(stage) === -1) {
        stages.push(stage);
      }
    });
    return stages;
  }, []);

  const stateVar = createVar();
  const streamingVar = createVar();
  const handlerVar = createVar();

  const stageVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();
  const chunkOffsetVar = createVar();

  const prevReaderVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();
  const takerResultVar = createVar();

  const bindings: Binding[] = [];

  const code: Code = [
    'var ',
    stageVar, '=', stateVar, '.stage,',
    chunkVar, '=', stateVar, '.chunk,',
    offsetVar, '=', stateVar, '.offset,',
    chunkOffsetVar, '=', stateVar, '.chunkOffset,',

    prevReaderVar, ',',
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length,',
    takerResultVar, ';',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    readers.map((reader) => {

      const {taker, stages} = reader;

      if (stages?.length === 0) {
        return '';
      }

      const readerVar = createVar();
      const takerVar = createVar();

      bindings.push([readerVar, reader]);

      if (!isTakerCodegen(taker)) {
        bindings.push([takerVar, taker]);
      }

      return [
        // Check if reader can be applied on the current stage
        stages ? ['if(', stages.map((stage, i) => [i === 0 ? '' : '||', stageVar, '===', uniqueStages.indexOf(stage)]), '){'] : '',

        // Take chars from the input string
        isTakerCodegen(taker) ? taker.factory(chunkVar, nextOffsetVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', chunkVar, ',', nextOffsetVar, ');'],

        'if(', takerResultVar, '!==' + ResultCode.NO_MATCH + '&&', takerResultVar, '!==', nextOffsetVar, '){',

        // Emit error
        'if(', takerResultVar, '<0){',
        handlerVar, '(', readerVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', takerResultVar, ');',
        'break}',

        // Emit unconfirmed token
        'if(', prevReaderVar, '){',
        handlerVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',
        prevReaderVar, '=undefined;',
        '}',

        stateVar, '.stage=', stageVar, ';',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        reader.nextStage === undefined ? '' : [stageVar, '=', uniqueStages.indexOf(reader.nextStage), ';'],
        prevReaderVar, '=', readerVar, ';',
        nextOffsetVar, '=', takerResultVar, ';',

        'continue}',

        stages ? '}' : '',
      ];
    }),
    'break}',

    'if(!', streamingVar, '&&', prevReaderVar, '){',
    handlerVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',

    stateVar, '.stage=', stageVar, ';',
    stateVar, '.offset=', nextOffsetVar, ';',
    '}',
  ];

  return compileFunction([stateVar, streamingVar, handlerVar], code, bindings);
}
