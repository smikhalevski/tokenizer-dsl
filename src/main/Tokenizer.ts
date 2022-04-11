import {compileRuleIterator, Rule, RuleHandler, RuleIteratorState} from './rules';
import {die} from './utils';

export class Tokenizer<S = any, C = void> implements RuleIteratorState {

  stageIndex;
  chunk = '';
  offset = 0;
  chunkOffset = 0;

  private readonly initialStageIndex;
  private readonly ruleIterator;

  constructor(rules: Rule<S, C>[], public handler: RuleHandler<S, C>, public context: C, initialStage?: S) {
    if (rules.length === 0) {
      die('Rules expected');
    }

    const ruleIterator = this.ruleIterator = compileRuleIterator(rules);
    this.stageIndex = this.initialStageIndex = ruleIterator.uniqueStages.indexOf(initialStage as S);
  }

  write(chunk: string): void {
    this.chunk = this.chunk.slice(this.offset) + chunk;
    this.chunkOffset += this.offset;
    this.offset = 0;
    this.ruleIterator(this, true, this.handler, this.context);
  }

  end(chunk?: string): void {
    if (chunk) {
      this.chunk = this.chunk.slice(this.offset) + chunk;
      this.chunkOffset += this.offset;
      this.offset = 0;
    }
    this.ruleIterator(this, false, this.handler, this.context);
  }

  reset(): void {
    this.stageIndex = this.initialStageIndex;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
