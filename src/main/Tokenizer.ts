import {compileRuleIterator, Rule, RuleHandler, RuleIteratorState} from './rules';

export class Tokenizer<S = never, C = never> implements RuleIteratorState {

  public stageIndex;
  public chunk = '';
  public offset = 0;
  public chunkOffset = 0;
  public handler;

  private readonly initialStageIndex;
  private readonly ruleIterator;

  public constructor(rules: Rule<S, C>[], handler: RuleHandler<S, C>, initialStage?: S) {
    if (rules.length === 0) {
      throw new Error('Rules expected');
    }

    const ruleIterator = this.ruleIterator = compileRuleIterator(rules);
    this.stageIndex = this.initialStageIndex = ruleIterator.uniqueStages.indexOf(initialStage as S);
    this.handler = handler;
  }

  public write(chunk: string): void {
    this.chunk = this.chunk.slice(this.offset) + chunk;
    this.chunkOffset += this.offset;
    this.offset = 0;
    this.ruleIterator(this, true, this.handler, null as any /*MISSING CONTEXT HERE*/);
  }

  public end(chunk?: string): void {
    if (chunk) {
      this.chunk = this.chunk.slice(this.offset) + chunk;
      this.chunkOffset += this.offset;
      this.offset = 0;
    }
    this.ruleIterator(this, false, this.handler, null as any /*MISSING CONTEXT HERE*/);
  }

  public reset(): void {
    this.stageIndex = this.initialStageIndex;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
