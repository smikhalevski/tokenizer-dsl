import { createVar, isImportedValue } from '../utils';
import { assembleJs, Code, createVarRenamer, Var, VarRenamer } from 'codedegen';
import { createRuleTree } from './createRuleTree';
import { Rule } from './rule-types';
import { compileRuleIteratorCodeBindings } from './compileRuleIterator';

export interface RuleIteratorModuleOptions {
  /**
   * If `true` then a TypeScript typings are output, so .ts file extension can be safely used.
   *
   * @default false
   */
  typingsEnabled?: boolean;
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
export function compileRuleIteratorModule<Type, Stage, Context = void>(rules: Rule<Type, Stage, Context>[], options: RuleIteratorModuleOptions = {}): string {

  const { typingsEnabled } = options;

  const stateVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();
  const streamingVar = createVar();

  const tree = createRuleTree(rules);

  const { code, bindings } = compileRuleIteratorCodeBindings(tree, stateVar, handlerVar, contextVar, streamingVar);

  const varRenamer = createVarRenamer();

  const argsSrc = [stateVar, handlerVar, contextVar, streamingVar].map(varRenamer).join(',');

  // Dedupe bound vars
  const varMap = new Map(bindings);

  // if (varMap.size === 0) {
  //   return assembleJs(['export default function(', argsSrc, '){return ', code, '};'], varRenamer);
  // }

  // Dedupe bound values
  const valueMap = inverseMap(varMap);

  const moduleCode: Code[] = [
    typingsEnabled ? 'import type {RuleIterator} from "tokenizer-dsl";' : '',
    'export default (function()',
    typingsEnabled ? ':RuleIterator<any,any,any>' : '',
    '{'
  ];

  const importsMap = new Map<string, Map<string | undefined, Var>>();

  valueMap.forEach((valueVar, value) => {
    if (!isImportedValue(value)) {
      moduleCode.push('const ', valueVar, '=', stringifyValue(value), ';');
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

  moduleCode.push(
    'return function(', argsSrc, '){', code, '}',
    '}());'
  );

  importsMap.forEach((exportsMap, modulePath) => {
    exportsMap.forEach((exportVar, exportName) => {
      moduleCode.unshift([
        'import ',
        exportName === undefined ? exportVar : ['{', exportName, ' as ', exportVar, '}'],
        ' from',
        JSON.stringify(modulePath), ';'
      ]);
    });
  });

  const moduleVarRenamer: VarRenamer = (valueVar) => varRenamer(varMap.has(valueVar) ? valueMap.get(varMap.get(valueVar))! : valueVar);

  return assembleJs(moduleCode, moduleVarRenamer);
}

function inverseMap<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(Array.from(map).map(([k, v]) => [v, k]));
}

function stringifyValue(value: any): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return JSON.stringify(value);
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (value instanceof RegExp) {
    return value.toString();
  }

  throw new Error('Cannot serialize ' + String(value));
}
