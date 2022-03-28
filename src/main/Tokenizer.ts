import {createTokenIterator, TokenHandler, TokenIteratorState} from './createTokenIterator';
import {Token} from './token-utils';

export class Tokenizer {

  private readonly initialStage;
  private readonly tokenIterator;
  private readonly state: TokenIteratorState = {
    stage: undefined,
    chunk: '',
    offset: 0,
    chunkOffset: 0,
  };

  public constructor(tokens: Token[], initialStage: unknown) {
    this.initialStage = this.state.stage = initialStage;
    this.tokenIterator = createTokenIterator(tokens);
  }

  public write(chunk: string, handler: TokenHandler): void {
    this.state.chunk = this.state.chunk.slice(this.state.offset) + chunk;
    this.state.chunkOffset += this.state.offset;
    this.state.offset = 0;
    this.tokenIterator(this.state, true, handler);
  }

  public end(chunk: string, handler: TokenHandler): void {
    this.state.chunk = this.state.chunk.slice(this.state.offset) + chunk;
    this.state.chunkOffset += this.state.offset;
    this.state.offset = 0;
    this.tokenIterator(this.state, false, handler);
  }

  public reset(): void {
    this.state.stage = undefined;
    this.state.chunk = '';
    this.state.offset = this.state.chunkOffset = 0;
  }
}
