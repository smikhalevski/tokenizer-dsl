import {compileRuleIterator, RuleIteratorState} from './compileRuleIterator';
import {Rule, RuleHandler} from './rule-types';

export class Tokenizer implements RuleIteratorState {

  public stage;
  public chunk = '';
  public offset = 0;
  public chunkOffset = 0;

  private readonly initialStage;
  private readonly ruleIterator;

  private handler;

  public constructor(rules: Rule[], handler: RuleHandler, initialStage?: unknown) {
    if (rules.length === 0) {
      throw new Error('Tokens expected');
    }

    const ruleIterator = this.ruleIterator = compileRuleIterator(rules);
    this.stage = this.initialStage = ruleIterator.uniqueStages.indexOf(initialStage);
    this.handler = handler;
  }

  public setHandler(handler: RuleHandler): void {
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
    this.stage = this.initialStage;
    this.chunk = '';
    this.offset = this.chunkOffset = 0;
  }
}
