import {Code, createVar, toTaker, Var} from './js';
import {ResultCode, Taker, TakerLike} from './taker-types';
import {isTakerCodegen} from './taker-utils';

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
   * The list of stages at which reader can be used.
   */
  stages?: S[];

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
    stages: options?.stages,
    nextStage: options?.nextStage,
    confirmationMode: options?.confirmationMode,
  };
}

export interface Handler<S> {

  onToken(reader: Reader<S>, start: number, end: number): void;

  onError(reader: Reader<S>, offset: number, errorCode: number): void;

  onUnrecognizedToken(offset: number): void;
}

export function createTokenizerCallback<S>(readers: Reader<S>[]): (this: Tokenizer, handler: Handler<S>) => void {

  const uniqueStages = readers.reduce<unknown[]>((stages, reader) => {
    if (reader.stages) {
      for (const stage of reader.stages) {
        if (stages.indexOf(stage) === -1) {
          stages.push(stage);
        }
      }
    }
    return stages;
  }, []);

  const stageVar = createVar();
  const onTokenVar = createVar();
  const onErrorVar = createVar();

  const inputVar = createVar();
  const offsetVar = createVar();

  const values: [Var, unknown][] = [];
  const tailCode: Code[] = [];

  const code: Code[] = [
    'while(true){',
    readers.map((reader) => {
      const {taker, stages} = reader;

      const readerVar = createVar();
      const takerVar = createVar();
      const takerResultVar = createVar();

      values.push([readerVar, reader]);

      if (isTakerCodegen(taker)) {
        values.push([takerVar, taker]);
      }

      return [
        !stages?.length ? '' : ['if(', stages.map((stage) => [stageVar, '===', uniqueStages.indexOf(stage)]), '){'],
        'var ', takerResultVar, ';',
        isTakerCodegen(taker) ? taker.factory(inputVar, offsetVar, takerResultVar) : [takerResultVar, '=', takerVar, '(', inputVar, ',', offsetVar, ');'],
        'if(', takerResultVar, '!==' + ResultCode.NO_MATCH + '){',

        // Raise error
        'if(', takerResultVar, '<0){',
        onErrorVar, '(', readerVar, ',', offsetVar, ',', takerResultVar, ');',
        'return}',

        // Emit token

        reader.confirmationMode === ConfirmationMode.NEVER ? [
            // Call reader immediately
            onTokenVar,'(',readerVar,',',offsetVar,',',takerResultVar,');',
        ] : [
            // Defer reader call
        ],

        'continue}',
        !stages?.length ? '' : '}',
      ];
    }),
    // No readers matched
    'break}'
  ];
  code.push(tailCode);
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

    if (this.prevReader && this.prevReader.stages === this.stage) {
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
