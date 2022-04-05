import {compileRuleIterator, Rule, RuleHandler, RuleIteratorState} from './rules';

export class Tokenizer implements RuleIteratorState {

  public stageIndex;
  public chunk = '';
  public offset = 0;
  public chunkOffset = 0;
  public handler;

  private readonly initialStageIndex;
  private readonly ruleIterator;

  public constructor(rules: Rule[], handler: RuleHandler, initialStage?: unknown) {
    if (rules.length === 0) {
      throw new Error('Tokens expected');
    }

    const ruleIterator = this.ruleIterator = compileRuleIterator(rules);
    this.stageIndex = this.initialStageIndex = ruleIterator.uniqueStages.indexOf(initialStage);
    this.handler = handler;
  }

  public write(chunk: string): void {
    this.chunk = this.chunk.slice(this.offset) + chunk;
    this.chunkOffset += this.offset;
    this.offset = 0;
    this.ruleIterator(this, true, this.handler);
  }

  public end(chunk?: string): void {
    if (chunk) {
      this.chunk = this.chunk.slice(this.offset) + chunk;
      this.chunkOffset += this.offset;
      this.offset = 0;
    }
    this.ruleIterator(this, false, this.handler);
  }

  public reset(): void {
    this.stageIndex = this.initialStageIndex;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
