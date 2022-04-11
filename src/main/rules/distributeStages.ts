import {SeqTaker, Taker} from '../takers';
import {Rule} from './rule-types';

export interface Aaa {
  prefix: Taker<any>[];
  children?: Aaa[];
  rule?: Rule<any, any>;
}

export interface StagePlan {
  stage?: any;
  aaaList: Aaa[];
}

export function distributeStages(rules: Rule<any, any>[]): StagePlan[] {
  const stagePlans: StagePlan[] = [];
  const defaultStagePlan: StagePlan = {aaaList: []};

  nextRule: for (const rule of rules) {
    if (rule.stages) {
      for (const stage of rule.stages) {
        for (const stagePlan of stagePlans) {
          if (stagePlan.stage === stage) {
            distributeRule(stagePlan.aaaList, rule);
            continue nextRule;
          }
        }
        stagePlans.push({stage, aaaList: distributeRule([], rule)});
      }
    } else {
      for (const stagePlan of stagePlans) {
        distributeRule(stagePlan.aaaList, rule);
      }
      distributeRule(defaultStagePlan.aaaList, rule);
    }
  }

  if (defaultStagePlan.aaaList.length) {
    stagePlans.push(defaultStagePlan);
  }

  return stagePlans;
}

export function distributeRule(res: Aaa[], rule: Rule<any, any>) {
  add(res, rule.taker instanceof SeqTaker ? rule.taker.takers : [rule.taker], rule);
  return res;
}

function add(roots: Aaa[], prefix: Taker<any>[], rule: Rule<any, any>) {

  for (let j = 0; j < roots.length; ++j) {

    const root = roots[j];

    let i = 0;

    // Find common prefix
    while (i < root.prefix.length && i < prefix.length && root.prefix[i] === prefix[i]) {
      ++i;
    }

    // No common prefix
    if (i === 0) {
      continue;
    }

    if (i === root.prefix.length) {

      if (root.rule) {
        // Absorbed by preceding rule
        return;
      }

      if (i === prefix.length) {
        // Terminates branch
        root.rule = rule;
        return;
      }

      add(root.children!, prefix.slice(i), rule);
      return;
    }


    const aaa: Aaa = roots[j] = {
      prefix: root.prefix.slice(0, i),
      children: [
        {
          prefix: root.prefix.slice(i),
          rule: root.rule,
          children: root.children,
        }
      ]
    };

    if (i === prefix.length) {
      aaa.rule = rule;
    } else {
      aaa.children!.push({
        prefix: prefix.slice(i),
        rule,
      });
    }

    return;
  }

  roots.push({prefix, rule});
}
