import {Reader, SeqReader} from '../readers';
import {Rule} from './rule-types';

export interface RuleTree<Type, Stage, Context> {

  /**
   * The set of the unique stages at which rules are applied. May be empty if rules didn't define any stages.
   */
  stages: Stage[];

  /**
   * The list of branches parallel to {@link stages}. May be empty if rules didn't define any stages.
   */
  branchesOnStage: RuleBranch<Type, Stage, Context>[][];

  /**
   * The list of branches that are used if there are no stages and {@link branchesOnStage} is empty.
   */
  branches: RuleBranch<Type, Stage, Context>[];
}

export interface RuleBranch<Type, Stage, Context> {

  /**
   * The non-empty list of readers that should sequentially read chars from the input to proceed to {@link children}
   * and/or {@link rule}.
   */
  readers: Reader<Context>[];

  /**
   * The optional list of branches that must be tried before the rule is applied.
   */
  children?: RuleBranch<Type, Stage, Context>[];

  /**
   * The optional rule that must be applied if none of the children matched.
   */
  rule?: Rule<Type, Stage, Context>;

  /**
   * The rule index, can be used as a rule UID.
   */
  ruleIndex?: number;
}

/**
 * Creates a tree that describes the most efficient way to apply tokenization rules.
 */
export function createRuleTree<Type, Stage, Context>(rules: Rule<Type, Stage, Context>[]): RuleTree<Type, Stage, Context> {
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

  const branchesOnStage: RuleBranch<Type, Stage, Context>[][] = [];
  const branches: RuleBranch<Type, Stage, Context>[] = [];

  for (let i = 0; i < stages.length; ++i) {
    branchesOnStage.push([]);
  }

  for (const rule of rules) {

    // Ensure the ID is unique and rule always has the same ID
    const ruleIndex = rules.indexOf(rule);

    // Append the rule to branches
    if (rule.on) {
      for (const stage of rule.on) {
        appendRule(branchesOnStage[stages.indexOf(stage)], rule, ruleIndex);
      }
      continue;
    }

    // Rule has no stages defined, so it is applied on every stage
    for (const stagePlan of branchesOnStage) {
      appendRule(stagePlan, rule, ruleIndex);
    }
    appendRule(branches, rule, ruleIndex);
  }

  return {
    stages,
    branchesOnStage,
    branches,
  };
}

/**
 * Appends the rule to the list of branches.
 *
 * @param branches The mutable list of branches to which the rule must be appended.
 * @param rule The rule to append.
 * @param ruleIndex The rule UID.
 * @returns The updated list of branches.
 */
export function appendRule<Type, Stage, Context>(branches: RuleBranch<Type, Stage, Context>[], rule: Rule<Type, Stage, Context>, ruleIndex: number): RuleBranch<Type, Stage, Context>[] {
  const {reader} = rule;

  distributeRule(branches, reader instanceof SeqReader ? reader.readers : [reader], rule, ruleIndex);

  return branches;
}

function distributeRule<Type, Stage, Context>(branches: RuleBranch<Type, Stage, Context>[], readers: Reader<Context>[], rule: Rule<Type, Stage, Context>, ruleIndex: number): void {

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
        branch.ruleIndex = ruleIndex;
        return;
      }

      // Distribute remaining readers
      distributeRule(branch.children!, readers.slice(j), rule, ruleIndex);
      return;
    }

    branch = branches[i] = {
      readers: readers.slice(0, j),
      children: [
        {
          readers: branchReaders.slice(j),
          children: branch.children,
          rule: branch.rule,
          ruleIndex: branch.ruleIndex,
        }
      ],
    };

    if (j === readersLength) {
      branch.rule = rule;
      branch.ruleIndex = ruleIndex;
      return;
    }

    branch.children!.push({
      readers: readers.slice(j),
      rule,
      ruleIndex,
    });
    return;
  }

  branches.push({
    readers,
    rule,
    ruleIndex,
  });
}
