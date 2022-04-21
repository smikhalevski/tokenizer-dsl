import {Reader} from '../readers';

export type StageResolver<Stage, Context> = (input: string, offset: number, length: number, context: Context) => Stage;

/**
 * Defines how the token is read from the input string and how {@link Tokenizer} transitions between stages.
 *
 * @template Stage The tokenizer stage type.
 * @template Context The context passed by tokenizer.
 */
export interface Rule<Type, Stage, Context> {

  /**
   * The type of the token that is emitted when the rule successfully reads chars from the input string. Type isn't
   * required to be unique, so multiple rules may share the same type if needed.
   */
  type: Type;

  /**
   * The reader that reads chars from the string.
   */
  reader: Reader<Context>;

  /**
   * The list of stages at which the rule can be used. If `undefined` then the rule is used on all stages. If an empty
   * array then the rule is never used.
   *
   * @default undefined
   */
  on?: Stage[] | undefined;

  /**
   * Provides the stage to which tokenizer transitions if this rule successfully reads a token.
   *
   * If `undefined` then the stage is left unchanged.
   *
   * @default undefined
   */
  to?: StageResolver<Stage, Context> | Stage | undefined;

  /**
   * If set to `true` then tokens read by this reader are not emitted.
   *
   * @default false
   */
  silent?: boolean;

  /**
   * If set to `true` then multiple sequential tokens read by this rule are emitted as a single token.
   *
   * @default false
   */
  continuous?: boolean;
}

/**
 * Handles tokens read from the input string.
 *
 * @template Type The type of tokens emitted by rules.
 */
export interface TokenHandler<Type> {

  /**
   * Triggered when a token was read from the input stream.
   *
   * @param type The type of the token as defined in {@link Rule.type}.
   * @param offset The absolute offset from the start of the input stream where the token starts.
   * @param length The number of chars read by the rule.
   */
  token(type: Type, offset: number, length: number): void;

  /**
   * Triggered when the rule returned an error code.
   *
   * @param type The type of the token as defined in {@link Rule.type}.
   * @param offset The offset at which the rule was used.
   * @param errorCode The error code. A negative integer <= -2.
   */
  error?(type: Type, offset: number, errorCode: number): void;

  /**
   * Triggered if there was no rule that could successfully read a token at the offset.
   *
   * @param offset The offset at which the unrecognized token starts.
   */
  unrecognizedToken?(offset: number): void;
}
