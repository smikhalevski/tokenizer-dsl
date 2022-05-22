import {seq} from '../../main';
import {appendRule, createRuleTree, Rule, RuleBranch, RuleTree} from '../../main/rules';

describe('createRuleTree', () => {

  test('appends a single rule to the default stage', () => {
    const reader1 = () => 0;
    const reader2 = () => 0;

    const rule: Rule = {reader: seq(reader1, reader2)};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: [],
      branchesOnStage: [],
      branches: [
        {
          readers: [reader1, reader2],
          rule,
        },
      ],
    };

    expect(createRuleTree([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a single rule to the stage', () => {
    const reader1 = () => 0;
    const reader2 = () => 0;

    const rule: Rule<unknown, string> = {reader: seq(reader1, reader2), on: ['STAGE_A']};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['STAGE_A'],
      branchesOnStage: [
        [{
          readers: [reader1, reader2],
          rule,
        }],
      ],
      branches: [],
    };

    expect(createRuleTree([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a multiple rules to the stage', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;
    const reader22 = () => 0;

    const rule1: Rule<unknown, string> = {reader: seq(reader1, reader12), on: ['STAGE_A']};
    const rule2: Rule<unknown, string> = {reader: seq(reader1, reader22), on: ['STAGE_A']};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['STAGE_A'],
      branchesOnStage: [
        [{
          readers: [reader1],
          children: [
            {
              readers: [reader12],
              rule: rule1,
            },
            {
              readers: [reader22],
              rule: rule2,
            },
          ],
        }],
      ],
      branches: [],
    };

    expect(createRuleTree([rule1, rule2])).toEqual(ruleIterationPlan);
  });

  test('appends a rules to different stages', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;
    const reader22 = () => 0;

    const rule1: Rule<unknown, string> = {reader: seq(reader1, reader12), on: ['STAGE_A']};
    const rule2: Rule<unknown, string> = {reader: seq(reader1, reader22), on: ['STAGE_B']};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['STAGE_A', 'STAGE_B'],
      branchesOnStage: [
        // STAGE_A
        [{
          readers: [reader1, reader12],
          rule: rule1,
        }],
        // STAGE_B
        [{
          readers: [reader1, reader22],
          rule: rule2,
        }],
      ],
      branches: [],
    };

    expect(createRuleTree([rule1, rule2])).toEqual(ruleIterationPlan);
  });

  test('appends a rule without a stage to the default stage and all other stages', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;
    const reader22 = () => 0;

    const rule1: Rule<unknown, string> = {reader: seq(reader1, reader12), on: ['STAGE_A']};
    const rule2: Rule<unknown, string> = {reader: seq(reader1, reader22)};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['STAGE_A'],
      branchesOnStage: [
        [{
          readers: [reader1],
          children: [
            {
              readers: [reader12],
              rule: rule1,
            },
            {
              readers: [reader22],
              rule: rule2,
            },
          ],
        }],
      ],
      branches: [{
        readers: [reader1, reader22],
        rule: rule2,
      }],
    };

    expect(createRuleTree([rule1, rule2])).toEqual(ruleIterationPlan);
  });
});

describe('appendRule', () => {

  test('appends a single rule', () => {
    const reader1 = () => 0;
    const reader2 = () => 0;

    const rule: Rule = {reader: seq(reader1, reader2)};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1, reader2],
        rule,
      },
    ];

    expect(appendRule([], rule)).toEqual(branches);
  });

  test('appends a rule without a common prefix', () => {
    const reader11 = () => 0;
    const reader12 = () => 0;
    const reader21 = () => 0;

    const rule1: Rule = {reader: seq(reader11, reader12)};
    const rule2: Rule = {reader: reader21};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader11, reader12],
        rule: rule1,
      },
      {
        readers: [reader21],
        rule: rule2,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(branches);
  });

  test('appends a rule with a common prefix', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;
    const reader21 = () => 0;

    const rule1: Rule = {reader: seq(reader1, reader12)};
    const rule2: Rule = {reader: seq(reader1, reader21)};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1],
        children: [
          {
            readers: [reader12],
            rule: rule1,
          },
          {
            readers: [reader21],
            rule: rule2,
          },
        ]
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(branches);
  });

  test('appends termination rule', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;

    const rule1: Rule = {reader: seq(reader1, reader12)};
    const rule2: Rule = {reader: reader1};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1],
        children: [
          {
            readers: [reader12],
            rule: rule1,
          },
        ],
        rule: rule2,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(branches);
  });

  test('ignores absorbed rules', () => {
    const reader1 = () => 0;
    const reader22 = () => 0;

    const rule1: Rule = {reader: reader1};
    const rule2: Rule = {reader: seq(reader1, reader22)};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1],
        rule: rule1,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(branches);
  });
});
