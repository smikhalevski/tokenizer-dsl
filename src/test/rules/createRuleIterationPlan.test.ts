import {createRule, seq} from '../../main';
import {
  appendRule,
  createRuleIterationPlan,
  RuleIterationPlan,
  RulePlan
} from '../../main/rules/createRuleIterationPlan';

describe('createRuleIterationPlan', () => {

  test('appends a single rule to the default stage', () => {
    const take1 = () => 0;
    const take2 = () => 0;

    const rule = createRule(seq(take1, take2));

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: [],
      stagePlans: [],
      defaultPlans: [
        {
          prefix: [take1, take2],
          rule,
        },
      ],
    };

    expect(createRuleIterationPlan([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a single rule to the stage', () => {
    const take1 = () => 0;
    const take2 = () => 0;

    const rule = createRule(seq(take1, take2), ['AAA']);

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA'],
      stagePlans: [
        [{
          prefix: [take1, take2],
          rule,
        }],
      ],
      defaultPlans: [],
    };

    expect(createRuleIterationPlan([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a multiple rules to the stage', () => {
    const take1 = () => 0;
    const take12 = () => 0;
    const take22 = () => 0;

    const rule1 = createRule(seq(take1, take12), ['AAA']);
    const rule2 = createRule(seq(take1, take22), ['AAA']);

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA'],
      stagePlans: [
        [{
          prefix: [take1],
          children: [
            {
              prefix: [take12],
              rule: rule1,
            },
            {
              prefix: [take22],
              rule: rule2,
            },
          ],
        }],
      ],
      defaultPlans: [],
    };

    expect(createRuleIterationPlan([rule1, rule2])).toEqual(ruleIterationPlan);
  });

  test('appends a rules to different stages', () => {
    const take1 = () => 0;
    const take12 = () => 0;
    const take22 = () => 0;

    const rule1 = createRule(seq(take1, take12), ['AAA']);
    const rule2 = createRule(seq(take1, take22), ['BBB']);

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA', 'BBB'],
      stagePlans: [
        [{
          prefix: [take1, take12],
          rule: rule1,
        }],
        [{
          prefix: [take1, take22],
          rule: rule2,
        }],
      ],
      defaultPlans: [],
    };

    expect(createRuleIterationPlan([rule1, rule2])).toEqual(ruleIterationPlan);
  });

  test('appends a rule without a stage to the default stage and all other stages', () => {
    const take1 = () => 0;
    const take2 = () => 0;

    const rule1 = createRule(seq(take1, take2), ['AAA']);
    const rule2 = createRule(seq(take1, take2));

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA'],
      stagePlans: [
        [{
          prefix: [take1, take2],
          rule: rule1,
        }],
      ],
      defaultPlans: [
        {
          prefix: [take1, take2],
          rule: rule2,
        },
      ],
    };

    expect(createRuleIterationPlan([rule1, rule2])).toEqual(ruleIterationPlan);
  });
});

describe('appendRule', () => {

  test('appends a single rule', () => {
    const take1 = () => 0;
    const take2 = () => 0;

    const rule = createRule(seq(take1, take2));

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [take1, take2],
        rule,
      },
    ];

    expect(appendRule([], rule)).toEqual(rulePlan);
  });

  test('appends a rule without a common prefix', () => {
    const take11 = () => 0;
    const take12 = () => 0;
    const take21 = () => 0;

    const rule1 = createRule(seq(take11, take12));
    const rule2 = createRule(take21);

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [take11, take12],
        rule: rule1,
      },
      {
        prefix: [take21],
        rule: rule2,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });

  test('appends a rule with a common prefix', () => {
    const take1 = () => 0;
    const take12 = () => 0;
    const take21 = () => 0;

    const rule1 = createRule(seq(take1, take12));
    const rule2 = createRule(seq(take1, take21));

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [take1],
        children: [
          {
            prefix: [take12],
            rule: rule1,
          },
          {
            prefix: [take21],
            rule: rule2,
          },
        ]
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });

  test('appends termination rule', () => {
    const take1 = () => 0;
    const take12 = () => 0;

    const rule1 = createRule(seq(take1, take12));
    const rule2 = createRule(take1);

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [take1],
        children: [
          {
            prefix: [take12],
            rule: rule1,
          },
        ],
        rule: rule2,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });

  test('ignores absorbed rules', () => {
    const take1 = () => 0;
    const take22 = () => 0;

    const rule1 = createRule(take1);
    const rule2 = createRule(seq(take1, take22));

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [take1],
        rule: rule1,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });
});
