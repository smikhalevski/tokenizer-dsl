import {compileTokenIterator, TokenIteratorState} from './compileTokenIterator';
import {Token, TokenHandler} from './token-types';

export class Tokenizer {

  private readonly initialStage;
  private readonly iterator;
  private readonly state: TokenIteratorState = {
    stage: -1,
    chunk: '',
    offset: 0,
    chunkOffset: 0,
  };
  private handler;

  public constructor(tokens: Token[], handler: TokenHandler, initialStage?: unknown) {
    if (tokens.length === 0) {
      throw new Error('Tokens expected');
    }

    const tokenIterator = this.iterator = compileTokenIterator(tokens);
    this.initialStage = this.state.stage = tokenIterator.uniqueStages.indexOf(initialStage);
    this.handler = handler;
  }

  public setHandler(handler: TokenHandler): void {
    this.handler = handler;
  }

  public write(chunk: string): void {
    const {state} = this;

    state.chunk = state.chunk.slice(state.offset) + chunk;
    state.chunkOffset += state.offset;
    state.offset = 0;
    this.iterator(this.state, true, this.handler);
  }

  public end(chunk?: string): void {
    const {state} = this;

    if (chunk) {
      state.chunk = state.chunk.slice(state.offset) + chunk;
      state.chunkOffset += state.offset;
      state.offset = 0;
    }
    this.iterator(state, false, this.handler);
  }

  public reset(): void {
    const {state} = this;

    state.stage = this.initialStage;
    state.chunk = '';
    state.offset = state.chunkOffset = 0;
  }
}
