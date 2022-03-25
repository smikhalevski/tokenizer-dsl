import {toTaker} from './js';
import {ResultCode, Taker, TakerLike} from './taker-types';

export const enum ConfirmationMode {
  ALWAYS = 'always',
  NEVER = 'never',
  STREAMING = 'streaming',
}

export interface Reader<S> extends ReaderOptions<S> {

  /**
   * The type of the emitted token.
   */
  tokenType: unknown;

  /**
   * Taker that reads chars from the string.
   */
  taker: Taker;
}

export interface ReaderOptions<S> {

  /**
   * The stage at which reader can be used.
   */
  stage?: S;

  /**
   * The stage which should be used for next reader if this reader has successfully read the token.
   */
  nextStage?: S;

  /**
   * Defines if the token should be emitted only after the consequent token was read.
   */
  confirmationMode?: ConfirmationMode;
}

export function createReader<S>(tokenType: unknown, taker: TakerLike, options?: ReaderOptions<S>): Reader<S> {
  return {
    tokenType,
    taker: toTaker(taker),
    stage: options?.stage,
    nextStage: options?.nextStage,
    confirmationMode: options?.confirmationMode,
  };
}

export interface Handler<S> {

  onToken(reader: Reader<S>, start: number, end: number): void;

  onError(reader: Reader<S>, offset: number, errorCode: number): void;

  onUnrecognizedToken(offset: number): void;
}

export class Tokenizer<S> {

  private readonly readers;
  private readonly initialStage;
  private stage;
  private offset = 0;
  private str = '';

  private prevReader: Reader<S> | undefined;
  private prevStart = -1;
  private prevEnd = -1;

  public constructor(readers: readonly Reader<S>[], initialStage: S) {
    this.readers = readers;
    this.stage = this.initialStage = initialStage;
  }

  public write(chunk: string, handler: Handler<S>): void {

    const {
      onToken,
      onError,
    } = handler;

    let {
      readers,
      stage,
      offset,
      str,
      prevReader,
      prevStart,
      prevEnd,
    } = this;

    const readersLength = readers.length;

    str = str + chunk;

    nextToken: while (true) {
      for (let i = 0; i < readersLength; ++i) {

        const reader = readers[i];
        const result = reader.taker(str, offset);

        if (result === ResultCode.NO_MATCH) {
          continue;
        }
        if (result < 0) {
          onError(reader, offset, result);
          return;
        }

        this.offset = result;

        if (reader.confirmationMode === ConfirmationMode.NEVER) {

          if (prevReader) {
            prevReader = this.prevReader = undefined;
            prevStart = this.prevStart = -1;
            prevEnd = this.prevEnd = -1;
          }

          onToken(reader, offset, result);

        } else {

          this.prevReader = reader;
          this.prevStart = offset;
          this.prevEnd = result;

          if (prevReader) {
            onToken(prevReader, prevStart, prevEnd);
          }

          prevReader = reader;
          prevStart = offset;
          prevEnd = result;
        }

        offset = result;

        const {nextStage} = reader;

        if (nextStage != null) {
          stage = nextStage;
        }

        continue nextToken;
      }
      break;
    }
  }

  public end(chunk: string, handler: Handler<S>): void {
    this.write(chunk, handler);

    if (this.prevReader && this.prevReader.stage === this.stage) {
      handler.onToken(this.prevReader, this.prevStart, this.offset = this.prevEnd);
    }
    if (this.offset !== 0) {
      handler.onUnrecognizedToken(this.offset);
    }
  }

  public reset(): void {

    this.stage = this.initialStage;
    this.offset = 0;
    this.str = '';

    this.prevReader = undefined;
    this.prevStart = -1;
    this.prevEnd = -1;
  }
}
