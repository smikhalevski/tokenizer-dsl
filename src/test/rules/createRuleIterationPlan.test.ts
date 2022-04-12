import {createRule, seq} from '../../main';
import {
  appendRule,
  createRuleIterationPlan,
  RuleIterationPlan,
  RulePlan
} from '../../main/rules/createRuleIterationPlan';

describe('createRuleIterationPlan', () => {

  test('appends a single rule to the default stage', () => {
    const read1 = () => 0;
    const read2 = () => 0;

    const rule = createRule(seq(read1, read2));

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: [],
      stagesComputed: false,
      stagePlans: [],
      defaultPlans: [
        {
          prefix: [read1, read2],
          rule,
        },
      ],
    };

    expect(createRuleIterationPlan([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a single rule to the stage', () => {
    const read1 = () => 0;
    const read2 = () => 0;

    const rule = createRule(seq(read1, read2), ['AAA']);

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA'],
      stagesComputed: false,
      stagePlans: [
        [{
          prefix: [read1, read2],
          rule,
        }],
      ],
      defaultPlans: [],
    };

    expect(createRuleIterationPlan([rule])).toEqual(ruleIterationPlan);
  });

  test('appends a multiple rules to the stage', () => {
    const read1 = () => 0;
    const read12 = () => 0;
    const read22 = () => 0;

    const rule1 = createRule(seq(read1, read12), ['AAA']);
    const rule2 = createRule(seq(read1, read22), ['AAA']);

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA'],
      stagesComputed: false,
      stagePlans: [
        [{
          prefix: [read1],
          children: [
            {
              prefix: [read12],
              rule: rule1,
            },
            {
              prefix: [read22],
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
    const read1 = () => 0;
    const read12 = () => 0;
    const read22 = () => 0;

    const rule1 = createRule(seq(read1, read12), ['AAA']);
    const rule2 = createRule(seq(read1, read22), ['BBB']);

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA', 'BBB'],
      stagesComputed: false,
      stagePlans: [
        [{
          prefix: [read1, read12],
          rule: rule1,
        }],
        [{
          prefix: [read1, read22],
          rule: rule2,
        }],
      ],
      defaultPlans: [],
    };

    expect(createRuleIterationPlan([rule1, rule2])).toEqual(ruleIterationPlan);
  });

  test('appends a rule without a stage to the default stage and all other stages', () => {
    const read1 = () => 0;
    const read2 = () => 0;

    const rule1 = createRule(seq(read1, read2), ['AAA']);
    const rule2 = createRule(seq(read1, read2));

    const ruleIterationPlan: RuleIterationPlan<any, any> = {
      stages: ['AAA'],
      stagesComputed: false,
      stagePlans: [
        [{
          prefix: [read1, read2],
          rule: rule1,
        }],
      ],
      defaultPlans: [
        {
          prefix: [read1, read2],
          rule: rule2,
        },
      ],
    };

    expect(createRuleIterationPlan([rule1, rule2])).toEqual(ruleIterationPlan);
  });
});

describe('appendRule', () => {

  test('appends a single rule', () => {
    const read1 = () => 0;
    const read2 = () => 0;

    const rule = createRule(seq(read1, read2));

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [read1, read2],
        rule,
      },
    ];

    expect(appendRule([], rule)).toEqual(rulePlan);
  });

  test('appends a rule without a common prefix', () => {
    const read11 = () => 0;
    const read12 = () => 0;
    const read21 = () => 0;

    const rule1 = createRule(seq(read11, read12));
    const rule2 = createRule(read21);

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [read11, read12],
        rule: rule1,
      },
      {
        prefix: [read21],
        rule: rule2,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });

  test('appends a rule with a common prefix', () => {
    const read1 = () => 0;
    const read12 = () => 0;
    const read21 = () => 0;

    const rule1 = createRule(seq(read1, read12));
    const rule2 = createRule(seq(read1, read21));

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [read1],
        children: [
          {
            prefix: [read12],
            rule: rule1,
          },
          {
            prefix: [read21],
            rule: rule2,
          },
        ]
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });

  test('appends termination rule', () => {
    const read1 = () => 0;
    const read12 = () => 0;

    const rule1 = createRule(seq(read1, read12));
    const rule2 = createRule(read1);

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [read1],
        children: [
          {
            prefix: [read12],
            rule: rule1,
          },
        ],
        rule: rule2,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });

  test('ignores absorbed rules', () => {
    const read1 = () => 0;
    const read22 = () => 0;

    const rule1 = createRule(read1);
    const rule2 = createRule(seq(read1, read22));

    const rulePlan: RulePlan<any, any>[] = [
      {
        prefix: [read1],
        rule: rule1,
      },
    ];

    expect(appendRule(appendRule([], rule1), rule2)).toEqual(rulePlan);
  });
});
