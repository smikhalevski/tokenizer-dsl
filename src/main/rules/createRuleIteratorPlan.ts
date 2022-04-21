import {Reader, SeqReader} from '../readers';
import {Rule} from './rule-types';

export interface RuleIteratorPlan<Type, Stage, Context> {

  /**
   * The set of the unique stages at which rules are applied. May be empty if rules didn't define any stages.
   */
  stages: Stage[];

  /**
   * The list of branches parallel to {@link stages}. May be empty if rules didn't define any stages.
   */
  branchesByStageIndex: RuleIteratorBranch<Type, Stage, Context>[][];

  /**
   * The list of branches that are used if there are no stages and {@link branchesByStageIndex} is empty.
   */
  branches: RuleIteratorBranch<Type, Stage, Context>[];
}

export interface RuleIteratorBranch<Type, Stage, Context> {

  /**
   * The non-empty list of readers that should sequentially read chars from the input to proceed to {@link children}
   * and/or {@link rule}.
   */
  readers: Reader<Context>[];

  /**
   * The optional list of branches that must be tried before the rule is applied.
   */
  children?: RuleIteratorBranch<Type, Stage, Context>[];

  /**
   * The optional rule that must be applied if none of the children matched.
   */
  rule?: Rule<Type, Stage, Context>;

  /**
   * The unique rule identifier.
   */
  ruleId?: number;
}

/**
 * Creates an optimized iteration plan required to apply rules in the most efficient way.
 */
export function createRuleIteratorPlan<Type, Stage, Context>(rules: Rule<Type, Stage, Context>[]): RuleIteratorPlan<Type, Stage, Context> {
  const stages: Stage[] = [];

  // Collect unique stages
  for (const rule of rules) {
    if (rule.on) {
      for (const stage of rule.on) {
        if (stages.indexOf(stage) === -1) {
          stages.push(stage);
        }
      }
    }
  }

  const branchesByStageIndex: RuleIteratorBranch<Type, Stage, Context>[][] = [];
  const branches: RuleIteratorBranch<Type, Stage, Context>[] = [];

  for (let i = 0; i < stages.length; ++i) {
    branchesByStageIndex.push([]);
  }

  for (const rule of rules) {

    // Ensure the ID is unique and rule always has the same ID
    const ruleId = rules.indexOf(rule);

    // Append the rule to branches
    if (rule.on) {
      for (const stage of rule.on) {
        appendRule(branchesByStageIndex[stages.indexOf(stage)], rule, ruleId);
      }
      continue;
    }

    // Rule has no stages defined, so it is applied on every stage
    for (const stagePlan of branchesByStageIndex) {
      appendRule(stagePlan, rule, ruleId);
    }
    appendRule(branches, rule, ruleId);
  }

  return {
    stages,
    branchesByStageIndex,
    branches,
  };
}

/**
 * Appends the rule to the list of branches.
 *
 * @param branches The mutable list of branches to which the rule must be appended.
 * @param rule The rule to append.
 * @param ruleId The unique rule identifier.
 * @returns The updated list of branches.
 */
export function appendRule<Type, Stage, Context>(branches: RuleIteratorBranch<Type, Stage, Context>[], rule: Rule<Type, Stage, Context>, ruleId: number): RuleIteratorBranch<Type, Stage, Context>[] {
  const {reader} = rule;

  distributeRule(branches, reader instanceof SeqReader ? reader.readers : [reader], rule, ruleId);

  return branches;
}

function distributeRule<Type, Stage, Context>(branches: RuleIteratorBranch<Type, Stage, Context>[], readers: Reader<Context>[], rule: Rule<Type, Stage, Context>, ruleId: number): void {

  const readersLength = readers.length;

  for (let i = 0; i < branches.length; ++i) {

    let branch = branches[i];

    const branchReaders = branch.readers;
    const branchReadersLength = branchReaders.length;

    let j = 0;

    // Find the length of common readers
    while (j < branchReadersLength && j < readersLength && branchReaders[j] === readers[j]) {
      ++j;
    }

    // No common readers
    if (j === 0) {
      continue;
    }

    if (j === branchReadersLength) {

      if (branch.rule) {
        // Absorbed by the preceding rule
        return;
      }

      if (j === readersLength) {
        // Terminates the branch
        branch.rule = rule;
        branch.ruleId = ruleId;
        return;
      }

      // Distribute remaining readers
      distributeRule(branch.children!, readers.slice(j), rule, ruleId);
      return;
    }

    branch = branches[i] = {
      readers: readers.slice(0, j),
      children: [
        {
          readers: branchReaders.slice(j),
          children: branch.children,
          rule: branch.rule,
          ruleId: branch.ruleId,
        }
      ],
    };

    if (j === readersLength) {
      branch.rule = rule;
      branch.ruleId = ruleId;
      return;
    }

    branch.children!.push({
      readers: readers.slice(j),
      rule,
      ruleId,
    });
    return;
  }

  branches.push({
    readers,
    rule,
    ruleId,
  });
}
