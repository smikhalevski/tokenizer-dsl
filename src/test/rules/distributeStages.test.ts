import {createRule, seq} from '../../main';
import {distributeRule} from '../../main/rules/distributeStages';

describe('distributeRule', () => {

  test('distributes a single rule', () => {
    const take1 = () => 0;
    const take2 = () => 0;

    const rule1 = createRule(seq(take1, take2));

    expect(distributeRule([], rule1)).toEqual([
      {
        prefix: [take1, take2],
        rule: rule1,
      },
    ]);
  });

  test('distributes a rule without a common prefix', () => {
    const take11 = () => 0;
    const take12 = () => 0;
    const take21 = () => 0;

    const rule1 = createRule(seq(take11, take12));
    const rule2 = createRule(take21);

    expect(distributeRule(distributeRule([], rule1), rule2)).toEqual([
      {
        prefix: [take11, take12],
        rule: rule1,
      },
      {
        prefix: [take21],
        rule: rule2,
      },
    ]);
  });

  test('distributes a rule with a common prefix', () => {
    const take1 = () => 0;
    const take12 = () => 0;
    const take21 = () => 0;

    const rule1 = createRule(seq(take1, take12));
    const rule2 = createRule(seq(take1, take21));

    expect(distributeRule(distributeRule([], rule1), rule2)).toEqual([
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
    ]);
  });

  test('distributes termination rule', () => {
    const take1 = () => 0;
    const take12 = () => 0;

    const rule1 = createRule(seq(take1, take12));
    const rule2 = createRule(take1);

    expect(distributeRule(distributeRule([], rule1), rule2)).toEqual([
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
    ]);
  });

  test('ignores absorbed rules', () => {
    const take1 = () => 0;
    const take22 = () => 0;

    const rule1 = createRule(take1);
    const rule2 = createRule(seq(take1, take22));

    expect(distributeRule(distributeRule([], rule1), rule2)).toEqual([
      {
        prefix: [take1],
        rule: rule1,
      },
    ]);
  });
});
