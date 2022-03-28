import {compileTokenIterator, TokenIteratorState} from './compileTokenIterator';
import {Token, TokenHandler} from './token-types';

export class Tokenizer {

  private readonly initialStage;
  private readonly tokenIterator;
  private readonly state: TokenIteratorState = {
    stage: undefined,
    chunk: '',
    offset: 0,
    chunkOffset: 0,
  };

  public constructor(tokens: Token[], initialStage?: unknown) {
    if (tokens.length === 0) {
      throw new Error('Tokens expected');
    }

    this.initialStage = this.state.stage = initialStage;
    this.tokenIterator = compileTokenIterator(tokens);
  }

  public write(chunk: string, handler: TokenHandler): void {
    const {state} = this;

    state.chunk = state.chunk.slice(state.offset) + chunk;
    state.chunkOffset += state.offset;
    state.offset = 0;
    this.tokenIterator(this.state, true, handler);
  }

  public end(chunk: string, handler: TokenHandler): void {
    const {state} = this;

    state.chunk = state.chunk.slice(state.offset) + chunk;
    state.chunkOffset += state.offset;
    state.offset = 0;
    this.tokenIterator(state, false, handler);
  }

  public reset(): void {
    const {state} = this;

    state.stage = undefined;
    state.chunk = '';
    state.offset = state.chunkOffset = 0;
  }
}
