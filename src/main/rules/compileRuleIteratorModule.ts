import { createVar, isExternalValue } from '../utils';
import { assembleJs, Code, createVarRenamer, Var, VarRenamer } from 'codedegen';
import { createRuleTree } from './createRuleTree';
import { Rule } from './rule-types';
import { compileRuleIteratorCodeBindings } from './compileRuleIterator';
import { inverseMap, stringifyValue } from './rule-utils';

export interface RuleIteratorModuleOptions {
  /**
   * If `true` then a TypeScript typings are output, so .ts file extension can be safely used.
   *
   * @default false
   */
  typingsEnabled?: boolean;

  /**
   * Serializes a bound value as a JS expression.
   *
   * @param value The value to stringify.
   */
  serializeValue?: (value: unknown) => string;
}

/**
 * Creates a code of the ES6 module that exports a pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 * @param options Compilation options.
 * @returns The module source code.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Stage The type of stages at which rules are applied.
 * @template Context The context that rules may consume.
 */
export function compileRuleIteratorModule<Type, Stage, Context = void>(
  rules: Rule<Type, Stage, Context>[],
  options: RuleIteratorModuleOptions = {}
): string {
  const { typingsEnabled, serializeValue = stringifyValue } = options;

  const stateVar = createVar('state');
  const handlerVar = createVar('handler');
  const contextVar = createVar('context');
  const streamingVar = createVar('streaming');

  const tree = createRuleTree(rules);

  const { code, bindings } = compileRuleIteratorCodeBindings(tree, stateVar, handlerVar, contextVar, streamingVar);

  const varRenamer = createVarRenamer();

  const argsSrc = [stateVar, handlerVar, contextVar, streamingVar].map(varRenamer).join(',');

  // Dedupe bound vars
  const varMap = new Map(bindings);

  // Dedupe bound values
  const valueMap = inverseMap(varMap);

  const importsMap = new Map<string, Map<string | undefined, Var>>();

  const boundValuesCode: Code[] = [];

  valueMap.forEach((valueVar, value) => {
    if (!isExternalValue(value)) {
      boundValuesCode.push('const ', valueVar, '=', serializeValue(value), ';');
      return;
    }

    const { modulePath, exportName } = value;

    const importMap = importsMap.get(modulePath) || importsMap.set(modulePath, new Map()).get(modulePath)!;

    const importVar = importMap.get(exportName);

    if (!importVar) {
      importMap.set(exportName, valueVar);
      return;
    }

    valueMap.set(value, importVar);
  });

  const moduleCode: Code[] = typingsEnabled ? ['import type {RuleIterator} from "tokenizer-dsl";'] : [];

  importsMap.forEach((exportsMap, modulePath) => {
    exportsMap.forEach((exportVar, exportName) => {
      moduleCode.push([
        'import ',
        exportName === undefined ? exportVar : ['{', exportName, ' as ', exportVar, '}'],
        ' from',
        JSON.stringify(modulePath),
        ';',
      ]);
    });
  });

  const moduleVarRenamer: VarRenamer = valueVar =>
    varRenamer(varMap.has(valueVar) ? valueMap.get(varMap.get(valueVar))! : valueVar);

  if (boundValuesCode.length === 0) {
    // All bound values are imported or there are no bindings
    const ruleIteratorVar = createVar('ruleIterator');

    if (typingsEnabled) {
      // prettier-ignore
      moduleCode.push(
        'const ', ruleIteratorVar, ':RuleIterator<any,any,any>',
        '=function(', argsSrc, '){', code, '};',
        'export default ', ruleIteratorVar, ';'
      );
    } else {
      moduleCode.push('export default function(', argsSrc, '){', code, '};');
    }
  } else {
    // prettier-ignore
    moduleCode.push(
      'export default (function()',
      typingsEnabled ? ':RuleIterator<any,any,any>' : '',
      '{',
      boundValuesCode,
      'return function(', argsSrc, '){', code, '}',
      '})();'
    );
  }

  return assembleJs(moduleCode, moduleVarRenamer);
}
