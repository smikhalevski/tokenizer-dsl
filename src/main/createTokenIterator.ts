import {Binding, Code, compileFunction, createVar} from './code';
import {ResultCode} from './takers';
import {isTakerCodegen} from './takers/taker-utils';
import {Token} from './token-utils';

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

export type TokenHandler = (token: Token, offset: number, result: number) => void;

export type TokenIterator = (state: TokenIteratorState, streaming: boolean, handler: TokenHandler) => void;

export function createTokenIterator(tokens: Token[]): TokenIterator {

  const uniqueStages = tokens.reduce<unknown[]>((stages, token) => {
    token.stages?.forEach((stage) => {
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

    tokens.map((token) => {

      const {taker, stages} = token;

      if (stages?.length === 0) {
        return '';
      }

      const tokenVar = createVar();
      const takerVar = createVar();

      bindings.push([tokenVar, token]);

      if (!isTakerCodegen(taker)) {
        bindings.push([takerVar, taker]);
      }

      return [
        // Check if token can be applied on the current stage
        stages ? ['if(', stages.map((stage, i) => [i === 0 ? '' : '||', stageVar, '===', uniqueStages.indexOf(stage)]), '){'] : '',

        // Take chars from the input string
        isTakerCodegen(taker) ? taker.factory(chunkVar, nextOffsetVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', chunkVar, ',', nextOffsetVar, ');'],

        'if(', takerResultVar, '!==' + ResultCode.NO_MATCH + '&&', takerResultVar, '!==', nextOffsetVar, '){',

        // Emit error
        'if(', takerResultVar, '<0){',
        handlerVar, '(', tokenVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', takerResultVar, ');',
        'break}',

        // Emit unconfirmed token
        'if(', prevReaderVar, '){',
        handlerVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',
        prevReaderVar, '=undefined;',
        '}',

        stateVar, '.stage=', stageVar, ';',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        token.nextStage === undefined ? '' : [stageVar, '=', uniqueStages.indexOf(token.nextStage), ';'],
        prevReaderVar, '=', tokenVar, ';',
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
