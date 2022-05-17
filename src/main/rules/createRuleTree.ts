import {Reader, SeqReader} from '../readers';
import {Rule} from './rule-types';

export interface RuleTree<Type, Stage, Context, Error> {

  /**
   * The set of the unique stages at which rules are applied. May be empty if rules didn't define any stages.
   */
  stages: Stage[];

  /**
   * The list of branches parallel to {@link stages}. May be empty if rules didn't define any stages.
   */
  branchesByStageIndex: RuleBranch<Type, Stage, Context, Error>[][];

  /**
   * The list of branches that are used if there are no stages and {@link branchesByStageIndex} is empty.
   */
  branches: RuleBranch<Type, Stage, Context, Error>[];
}

export interface RuleBranch<Type, Stage, Context, Error> {

  /**
   * The non-empty list of readers that should sequentially read chars from the input to proceed to {@link children}
   * and/or {@link rule}.
   */
  readers: Reader<Context, Error>[];

  /**
   * The optional list of branches that must be tried before the rule is applied.
   */
  children?: RuleBranch<Type, Stage, Context, Error>[];

  /**
   * The optional rule that must be applied if none of the children matched.
   */
  rule?: Rule<Type, Stage, Context, Error>;

  /**
   * The rule index, can be used as a rule UID.
   */
  ruleIndex?: number;
}

/**
 * Creates a tree that describes the most efficient way to apply tokenization rules.
 */
export function createRuleTree<Type, Stage, Context, Error>(rules: Rule<Type, Stage, Context, Error>[]): RuleTree<Type, Stage, Context, Error> {
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

  const branchesByStageIndex: RuleBranch<Type, Stage, Context, Error>[][] = [];
  const branches: RuleBranch<Type, Stage, Context, Error>[] = [];

  for (let i = 0; i < stages.length; ++i) {
    branchesByStageIndex.push([]);
  }

  for (const rule of rules) {

    // Ensure the ID is unique and rule always has the same ID
    const ruleIndex = rules.indexOf(rule);

    // Append the rule to branches
    if (rule.on) {
      for (const stage of rule.on) {
        appendRule(branchesByStageIndex[stages.indexOf(stage)], rule, ruleIndex);
      }
      continue;
    }

    // Rule has no stages defined, so it is applied on every stage
    for (const stagePlan of branchesByStageIndex) {
      appendRule(stagePlan, rule, ruleIndex);
    }
    appendRule(branches, rule, ruleIndex);
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
 * @param ruleIndex The rule UID.
 * @returns The updated list of branches.
 */
export function appendRule<Type, Stage, Context, Error>(branches: RuleBranch<Type, Stage, Context, Error>[], rule: Rule<Type, Stage, Context, Error>, ruleIndex: number): RuleBranch<Type, Stage, Context, Error>[] {
  const {reader} = rule;

  distributeRule(branches, reader instanceof SeqReader ? reader.readers : [reader], rule, ruleIndex);

  return branches;
}

function distributeRule<Type, Stage, Context, Error>(branches: RuleBranch<Type, Stage, Context, Error>[], readers: Reader<Context, Error>[], rule: Rule<Type, Stage, Context, Error>, ruleIndex: number): void {

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
