import {seq} from '../../main';
import {appendRule, createRuleTree, Rule, RuleBranch, RuleTree} from '../../main/rules';

describe('createRuleTree', () => {

  test('appends a single rule to the default stage', () => {
    const reader1 = () => 0;
    const reader2 = () => 0;

    const rule: Rule = {type: 'Type', reader: seq(reader1, reader2)};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: [],
      branchesByStageIndex: [],
      branches: [
        {
          readers: [reader1, reader2],
          rule,
          ruleIndex: 0,
        },
      ],
    };

    expect(createRuleTree([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a single rule to the stage', () => {
    const reader1 = () => 0;
    const reader2 = () => 0;

    const rule: Rule<unknown, string> = {type: 'Type', reader: seq(reader1, reader2), on: ['A']};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['A'],
      branchesByStageIndex: [
        [{
          readers: [reader1, reader2],
          rule,
          ruleIndex: 0,
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

    const rule1: Rule<unknown, string> = {type: 'Type1', reader: seq(reader1, reader12), on: ['A']};
    const rule2: Rule<unknown, string> = {type: 'Type2', reader: seq(reader1, reader22), on: ['A']};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['A'],
      branchesByStageIndex: [
        [{
          readers: [reader1],
          children: [
            {
              readers: [reader12],
              rule: rule1,
              ruleIndex: 0,
            },
            {
              readers: [reader22],
              rule: rule2,
              ruleIndex: 1,
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

    const rule1: Rule<unknown, string> = {type: 'Type', reader: seq(reader1, reader12), on: ['A']};
    const rule2: Rule<unknown, string> = {type: 'Type', reader: seq(reader1, reader22), on: ['B']};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['A', 'B'],
      branchesByStageIndex: [
        // A
        [{
          readers: [reader1, reader12],
          rule: rule1,
          ruleIndex: 0,
        }],
        // B
        [{
          readers: [reader1, reader22],
          rule: rule2,
          ruleIndex: 1,
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

    const rule1: Rule<unknown, string> = {type: 'Type1', reader: seq(reader1, reader12), on: ['A']};
    const rule2: Rule<unknown, string> = {type: 'Type2', reader: seq(reader1, reader22)};

    const ruleIterationPlan: RuleTree<any, any, any> = {
      stages: ['A'],
      branchesByStageIndex: [
        [{
          readers: [reader1],
          children: [
            {
              readers: [reader12],
              rule: rule1,
              ruleIndex: 0,
            },
            {
              readers: [reader22],
              rule: rule2,
              ruleIndex: 1,
            },
          ],
        }],
      ],
      branches: [{
        readers: [reader1, reader22],
        rule: rule2,
        ruleIndex: 1,
      }],
    };

    expect(createRuleTree([rule1, rule2])).toEqual(ruleIterationPlan);
  });
});

describe('appendRule', () => {

  test('appends a single rule', () => {
    const reader1 = () => 0;
    const reader2 = () => 0;

    const rule: Rule = {type: 'Type', reader: seq(reader1, reader2)};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1, reader2],
        rule,
        ruleIndex: 777,
      },
    ];

    expect(appendRule([], rule, 777)).toEqual(branches);
  });

  test('appends a rule without a common prefix', () => {
    const reader11 = () => 0;
    const reader12 = () => 0;
    const reader21 = () => 0;

    const rule1: Rule = {type: 'Type1', reader: seq(reader11, reader12)};
    const rule2: Rule = {type: 'Type2', reader: reader21};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader11, reader12],
        rule: rule1,
        ruleIndex: 777,
      },
      {
        readers: [reader21],
        rule: rule2,
        ruleIndex: 888,
      },
    ];

    expect(appendRule(appendRule([], rule1, 777), rule2, 888)).toEqual(branches);
  });

  test('appends a rule with a common prefix', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;
    const reader21 = () => 0;

    const rule1: Rule = {type: 'Type1', reader: seq(reader1, reader12)};
    const rule2: Rule = {type: 'Type2', reader: seq(reader1, reader21)};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1],
        children: [
          {
            readers: [reader12],
            rule: rule1,
            ruleIndex: 777,
          },
          {
            readers: [reader21],
            rule: rule2,
            ruleIndex: 888,
          },
        ]
      },
    ];

    expect(appendRule(appendRule([], rule1, 777), rule2, 888)).toEqual(branches);
  });

  test('appends termination rule', () => {
    const reader1 = () => 0;
    const reader12 = () => 0;

    const rule1: Rule = {type: 'Type1', reader: seq(reader1, reader12)};
    const rule2: Rule = {type: 'Type2', reader: reader1};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1],
        children: [
          {
            readers: [reader12],
            rule: rule1,
            ruleIndex: 777,
          },
        ],
        rule: rule2,
        ruleIndex: 888,
      },
    ];

    expect(appendRule(appendRule([], rule1, 777), rule2, 888)).toEqual(branches);
  });

  test('ignores absorbed rules', () => {
    const reader1 = () => 0;
    const reader22 = () => 0;

    const rule1: Rule = {type: 'Type1', reader: reader1};
    const rule2: Rule = {type: 'Type2', reader: seq(reader1, reader22)};

    const branches: RuleBranch<any, any, any>[] = [
      {
        readers: [reader1],
        rule: rule1,
        ruleIndex: 777,
      },
    ];

    expect(appendRule(appendRule([], rule1, 777), rule2, 888)).toEqual(branches);
  });
});
