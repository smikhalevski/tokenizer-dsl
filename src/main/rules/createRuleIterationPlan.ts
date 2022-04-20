import {Reader, SeqReader} from '../readers';
import {Rule} from './rule-types';

export interface RuleIterationPlan<S, C> {
  stages: S[];
  stagesComputed: boolean;
  stagePlans: RulePlan<S, C>[][];
  defaultPlans: RulePlan<S, C>[];
}

export interface RulePlan<S, C> {

  /**
   * Non-empty list of readers.
   */
  prefix: Reader<C>[];
  children?: RulePlan<S, C>[];
  rule?: Rule<S, C>;
}

export function createRuleIterationPlan<S, C>(rules: Rule<S, C>[]): RuleIterationPlan<S, C> {
  const stages: S[] = [];

  let stagesComputed = false;

  for (const rule of rules) {
    if (rule.stages) {
      for (const stage of rule.stages) {
        if (stages.indexOf(stage) === -1) {
          stages.push(stage);
        }
      }
    }
    stagesComputed ||= typeof rule.nextStage === 'function';
  }

  const stagePlans: RulePlan<S, C>[][] = [];
  const defaultPlans: RulePlan<S, C>[] = [];

  for (let i = 0; i < stages.length; ++i) {
    stagePlans.push([]);
  }

  for (const rule of rules) {

    // Append the rule to stages
    if (rule.stages) {
      for (const stage of rule.stages) {
        appendRule(stagePlans[stages.indexOf(stage)], rule);
      }
      continue;
    }

    // No stages defined, so the rule is applied on every stage
    for (const stagePlan of stagePlans) {
      appendRule(stagePlan, rule);
    }
    appendRule(defaultPlans, rule);
  }

  return {
    stages,
    stagesComputed,
    stagePlans,
    defaultPlans,
  };
}

/**
 * Appends the rule to the tree of plans.
 */
export function appendRule<S, C>(plans: RulePlan<S, C>[], rule: Rule<S, C>): RulePlan<S, C>[] {
  const {reader} = rule;

  distributeRule(plans, reader instanceof SeqReader ? reader.readers : [reader], rule);
  return plans;
}

function distributeRule<S, C>(plans: RulePlan<S, C>[], prefix: Reader<C>[], rule: Rule<S, C>): void {

  const prefixLength = prefix.length;

  for (let i = 0; i < plans.length; ++i) {

    let plan = plans[i];

    const planPrefix = plan.prefix;
    const planPrefixLength = planPrefix.length;

    let j = 0;

    // Find common prefix length
    while (j < planPrefixLength && j < prefixLength && planPrefix[j] === prefix[j]) {
      ++j;
    }

    // No common prefix
    if (j === 0) {
      continue;
    }

    if (j === planPrefixLength) {

      if (plan.rule) {
        // Absorbed by the preceding rule
        return;
      }

      if (j === prefixLength) {
        // Terminate the branch
        plan.rule = rule;
        return;
      }

      // Distribute the prefix remainder
      distributeRule(plan.children!, prefix.slice(j), rule);
      return;
    }

    plan = plans[i] = {
      prefix: prefix.slice(0, j),
      children: [
        {
          prefix: planPrefix.slice(j),
          children: plan.children,
          rule: plan.rule,
        }
      ],
    };

    if (j === prefixLength) {
      plan.rule = rule;
      return;
    }

    plan.children!.push({
      prefix: prefix.slice(j),
      rule,
    });
    return;
  }

  plans.push({
    prefix,
    rule,
  });
}
