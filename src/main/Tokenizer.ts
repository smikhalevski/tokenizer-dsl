import {compileRuleIterator, createRuleIteratorPlan, Rule, RuleIteratorState, TokenHandler} from './rules';
import {die} from './utils';

export class Tokenizer<Type, Stage, Context> implements RuleIteratorState<Stage> {

  stage;
  chunk = '';
  offset = 0;
  chunkOffset = 0;

  private readonly _initialStage;
  private readonly _ruleIterator;

  /**
   * Creates a new {@link Tokenizer} instance.
   *
   * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
   * @param handler The set of callbacks that are invoked in response to tokenization events.
   * @param context The context value passed to {@link Reader} and {@link StageResolver} instances.
   * @param initialStage The initial state from which tokenization starts.
   */
  constructor(rules: Rule<Type, Stage, Context>[], public handler: TokenHandler<Type>, public context: Context, initialStage: Stage) {
    if (rules.length === 0) {
      die('Rules expected');
    }

    this.stage = this._initialStage = initialStage;
    this._ruleIterator = compileRuleIterator(createRuleIteratorPlan(rules));
  }

  write(chunk: string): void {
    this.chunk = this.chunk.slice(this.offset) + chunk;
    this.chunkOffset += this.offset;
    this.offset = 0;
    this._ruleIterator(this, true, this.handler, this.context);
  }

  end(chunk?: string): void {
    if (chunk) {
      this.chunk = this.chunk.slice(this.offset) + chunk;
      this.chunkOffset += this.offset;
      this.offset = 0;
    }
    this._ruleIterator(this, false, this.handler, this.context);
    this.reset();
  }

  reset(): void {
    this.stage = this._initialStage;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
