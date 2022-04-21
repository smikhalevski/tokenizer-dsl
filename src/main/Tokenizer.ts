import {compileRuleIterator, Rule, RuleHandler, RuleIteratorState} from './rules';
import {createRuleIterationPlan} from './rules/createRuleIterationPlan';
import {die} from './utils';

export class Tokenizer<S = any, C = void> implements RuleIteratorState {

  stageIndex;
  chunk = '';
  offset = 0;
  chunkOffset = 0;

  private readonly _initialStageIndex;
  private readonly _ruleIterator;

  constructor(rules: Rule<S, C>[], public handler: RuleHandler<S, C>, public context: C, initialStage?: S) {
    if (rules.length === 0) {
      die('Rules expected');
    }

    const ruleIterator = this._ruleIterator = compileRuleIterator(createRuleIterationPlan(rules));
    this.stageIndex = this._initialStageIndex = ruleIterator.stages.indexOf(initialStage as S);
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
    this.stageIndex = this._initialStageIndex;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
