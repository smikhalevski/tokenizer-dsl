import {Binding, Code, compileFunction, Var} from 'codedegen';
import {createReaderCallCode, seq} from '../readers';
import {createVar} from '../utils';
import {RuleBranch, RuleTree} from './createRuleTree';
import {TokenHandler, TokenizerState} from './rule-types';

/**
 * The callback that reads tokens from the input defined by iterator state.
 */
export type RuleIterator<Type, Stage, Context> = (state: TokenizerState<Stage>, handler: TokenHandler<Type, Context>, context: Context, streaming?: boolean) => void;

/**
 * Compiles rules into a function that applies them one after another in a loop.
 */
export function compileRuleIterator<Type, Stage, Context>(tree: RuleTree<Type, Stage, Context>): RuleIterator<Type, Stage, Context> {

  const {stages, branchesOnStage, branches} = tree;

  const stateVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();
  const streamingVar = createVar();

  const stageVar = createVar();
  const chunkVar = createVar();
  const offsetVar = createVar();

  const prevRuleIdVar = createVar();
  const prevRuleTypeVar = createVar();
  const nextOffsetVar = createVar();
  const chunkLengthVar = createVar();

  const stagesVar = createVar();

  // If true then raw stages cannot be used in the output code and must be resolved by the index in stagesVar
  const stagesIndexed = stages.some((stage) => typeof stage !== 'number' || stage === (stage | 0));
  const stagesEnabled = stages.length !== 0;

  const bindings: Binding[] = stagesIndexed ? [[stagesVar, stages]] : [];

  const createRuleIteratorBranchesCode = (branches: RuleBranch<Type, Stage, Context>[], branchOffsetVar: Var): Code => {

    const branchResultVar = createVar();

    const code: Code[] = ['var ', branchResultVar, ';'];

    for (const branch of branches) {
      const {rule} = branch;

      // Read branch
      code.push(
          createReaderCallCode(seq(...branch.readers), chunkVar, branchOffsetVar, contextVar, branchResultVar, bindings),
          'if(', branchResultVar, '>', branchOffsetVar, '){',
      );

      // Apply nested branches
      if (branch.children) {
        code.push(createRuleIteratorBranchesCode(branch.children, branchResultVar));
      }

      // If there's no termination rule then exit
      if (!rule) {
        code.push('}');
        continue;
      }

      const ruleTypeVar = createVar();
      const ruleToCallbackVar = createVar();

      const ruleTo = rule.to;

      // Update bindings
      bindings.push([ruleTypeVar, rule.type]);
      if (typeof ruleTo === 'function') {
        bindings.push([ruleToCallbackVar, ruleTo]);
      }

      code.push([

        // Emit confirmed token
        'if(', prevRuleIdVar, '!==-1){',
        handlerVar, '(', prevRuleTypeVar, ',', chunkVar, ',', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ',', stateVar, ');',
        prevRuleIdVar, '=-1}',

        // If stagesEnabled then stageIndex is never -1 so no out-of-bounds check is required
        stagesEnabled ? [stateVar, '.stage=', stagesIndexed ? [stagesVar, '[', stageVar, ']'] : stageVar, ';'] : '',
        stateVar, '.offset=', offsetVar, '=', nextOffsetVar, ';',

        rule.silent ? '' : [
          prevRuleIdVar, '=', branch.ruleId, ';',
          prevRuleTypeVar, '=', ruleTypeVar, ';',
        ],

        ruleTo === undefined ? '' : typeof ruleTo === 'function'
            ? [stageVar, '=', stagesIndexed ? [stagesVar, '.indexOf('] : '(', ruleToCallbackVar, '(', chunkVar, ',', nextOffsetVar, ',', branchResultVar, '-', nextOffsetVar, ',', contextVar, ',', stateVar, '));']
            : [stageVar, '=', stagesIndexed ? stages.indexOf(ruleTo) : ruleTo as unknown as number, ';'],

        nextOffsetVar, '=', branchResultVar, ';',

        // Restart the looping over characters in the input chunk
        'continue}',
      ]);

    }

    return code;
  };

  const code: Code = [
    'var ',
    stagesEnabled ? [stageVar, '=', stagesIndexed ? [stagesVar, '.indexOf('] : '(', stateVar, '.stage),'] : '',
    chunkVar, '=', stateVar, '.chunk,',
    offsetVar, '=', stateVar, '.offset,',

    prevRuleIdVar, '=-1,',
    prevRuleTypeVar, ',',
    nextOffsetVar, '=', offsetVar, ',',
    chunkLengthVar, '=', chunkVar, '.length;',

    'while(', nextOffsetVar, '<', chunkLengthVar, '){',

    // Apply rules available on the current stage
    stagesEnabled
        ? [
          'switch(', stageVar, '){',
          branchesOnStage.map((branches, stageIndex) => [
            'case ', stagesIndexed ? stageIndex : stages[stageIndex] as unknown as number, ':',
            createRuleIteratorBranchesCode(branches, nextOffsetVar),
            'break;'
          ]),
          '}',
        ]
        : createRuleIteratorBranchesCode(branches, nextOffsetVar),

    'break}',

    'if(', streamingVar, ')return;',

    // Emit last unconfirmed token
    'if(', prevRuleIdVar, '!==-1){',
    handlerVar, '(', prevRuleTypeVar, ',', chunkVar, ',', offsetVar, ',', nextOffsetVar, '-', offsetVar, ',', contextVar, ',', stateVar, ');',
    '}',

    // Update unconfirmed stage and offset
    stagesEnabled ? [stateVar, '.stage=', stagesIndexed ? [stagesVar, '[', stageVar, ']'] : stageVar, ';'] : '',
    stateVar, '.offset=', nextOffsetVar, ';',
  ];

  return compileFunction<RuleIterator<Type, Stage, Context>>([stateVar, handlerVar, contextVar, streamingVar], code, bindings);
}
