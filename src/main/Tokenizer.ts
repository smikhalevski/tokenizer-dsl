import {compileTokenIterator, TokenIteratorState} from './compileTokenIterator';
import {Token, TokenHandler} from './token-types';

export class Tokenizer implements TokenIteratorState {

  public stage;
  public chunk = '';
  public offset = 0;
  public chunkOffset = 0;

  private readonly initialStage;
  private readonly tokenIterator;

  private handler;

  public constructor(tokens: Token[], handler: TokenHandler, initialStage?: unknown) {
    if (tokens.length === 0) {
      throw new Error('Tokens expected');
    }

    const tokenIterator = this.tokenIterator = compileTokenIterator(tokens);
    this.stage = this.initialStage = tokenIterator.uniqueStages.indexOf(initialStage);
    this.handler = handler;
  }

  public setHandler(handler: TokenHandler): void {
    this.handler = handler;
  }

  public write(chunk: string): void {
    this.chunk = this.chunk.slice(this.offset) + chunk;
    this.chunkOffset += this.offset;
    this.offset = 0;
    this.tokenIterator(this, true, this.handler);
  }

  public end(chunk?: string): void {
    if (chunk) {
      this.chunk = this.chunk.slice(this.offset) + chunk;
      this.chunkOffset += this.offset;
      this.offset = 0;
    }
    this.tokenIterator(this, false, this.handler);
  }

  public reset(): void {
    this.stage = this.initialStage;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
