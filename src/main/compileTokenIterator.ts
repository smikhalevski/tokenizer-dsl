import {Code, Var} from './code-types';
import {compileFunction, createVar} from './code-utils';
import {ResultCode} from './takers';
import {isTakerCodegen} from './takers/taker-utils';
import {Token, TokenHandler} from './token-types';

/**
 * The mutable iterator state.
 */
export interface TokenIteratorState {

  /**
   * The current tokenizer stage. A positive integer or -1 if stage is undefined.
   */
  stage: number;

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

/**
 * The callback that reads tokens from the input defined by iterator state.
 */
export interface TokenIterator {

  (state: TokenIteratorState, streaming: boolean, handler: TokenHandler): void;

  /**
   * The list of unique stages that are used by tokens that comprise this iterator.
   */
  uniqueStages: readonly unknown[];
}

/**
 * Compiles tokens into a token iterator function.
 *
 * @param tokens The list of tokes that iterator can process.
 */
export function compileTokenIterator(tokens: Token[]): TokenIterator {

  const uniqueStages: unknown[] = [];

  for (const token of tokens) {
    if (!token.stages) {
      continue;
    }
    for (const stage of token.stages) {
      if (uniqueStages.indexOf(stage) === -1) {
        uniqueStages.push(stage);
      }
    }
  }

  const stateVar = createVar();
  const streamingVar = createVar();
  const handlerVar = createVar();

  const tokenCallbackVar = createVar();
  const errorCallbackVar = createVar();
  const unrecognizedTokenCallbackVar = createVar();

  const stageVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();
  const chunkOffsetVar = createVar();

  const prevReaderVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();
  const takerResultVar = createVar();

  const bindings: [Var, unknown][] = [];

  const code: Code = [
    'var ',
    stageVar, '=', stateVar, '.stage,',
    chunkVar, '=', stateVar, '.chunk,',
    offsetVar, '=', stateVar, '.offset,',
    chunkOffsetVar, '=', stateVar, '.chunkOffset,',

    tokenCallbackVar, '=', handlerVar, '.token,',
    errorCallbackVar, '=', handlerVar, '.error,',
    unrecognizedTokenCallbackVar, '=', handlerVar, '.unrecognizedToken,',

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
        errorCallbackVar, '(', tokenVar, ',', chunkOffsetVar, '+', nextOffsetVar, ',', takerResultVar, ');',
        'return}',

        // Emit confirmed token
        'if(', prevReaderVar, '){',
        tokenCallbackVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',
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

    'if(', streamingVar, ')return;',

    // Emit trailing unconfirmed token
    'if(', prevReaderVar, '){',
    tokenCallbackVar, '(', prevReaderVar, ',', chunkOffsetVar, '+', offsetVar, ',', chunkOffsetVar, '+', nextOffsetVar, ');',
    stateVar, '.stage=', stageVar, ';',
    stateVar, '.offset=', nextOffsetVar, ';',
    '}',

    // Trigger unrecognized token
    'if(', nextOffsetVar, '!==', chunkLengthVar, ')',
    unrecognizedTokenCallbackVar, '(', chunkOffsetVar, '+', nextOffsetVar, ');',
  ];

  const tokenIterator = compileFunction<TokenIterator>([stateVar, streamingVar, handlerVar], code, bindings);

  tokenIterator.uniqueStages = uniqueStages;

  return tokenIterator;
}
