import { compileRuleIteratorCodeBindings, createRuleTree, Rule } from './rules';
import { createVar, isImportedValue } from './utils';
import { assembleJs, Code, createVarRenamer, Var, VarRenamer } from 'codedegen';

/**
 * Creates a code of the ES6/TS module that exports a pure tokenizer function.
 *
 * @param rules The list of rules that tokenizer uses to read tokens from the input chunks.
 * @param initialStage The initial stage at which the tokenizer should start.
 * @returns The module source code.
 *
 * @template Type The type of tokens emitted by the tokenizer.
 * @template Stage The type of stages at which rules are applied.
 * @template Context The context that rules may consume.
 */
export function compileTokenizerModule<Type, Stage, Context>(rules: Rule<Type, Stage, Context>[], initialStage?: Stage): string {

  const stateVar = createVar();
  const handlerVar = createVar();
  const contextVar = createVar();
  const streamingVar = createVar();

  const tree = createRuleTree(rules);

  const { code, bindings } = compileRuleIteratorCodeBindings(tree, stateVar, handlerVar, contextVar, streamingVar);

  const varRenamer = createVarRenamer();

  const argsSrc = [stateVar, handlerVar, contextVar, streamingVar].map(varRenamer).join(',');
  const initialStageSrc = initialStage === undefined ? '' : ',' + stringifyValue(initialStage);

  // Dedupe bound vars
  const varMap = new Map(bindings);

  if (varMap.size === 0) {
    return assembleJs(
      [
        'import{createTokenizerForRuleIterator}from"tokenizer-dsl";',
        'export default createTokenizerForRuleIterator(function(', argsSrc, '){return ', code, '}', initialStageSrc, ');'
      ],
      varRenamer
    );
  }

  // Dedupe bound values
  const valueMap = inverseMap(varMap);

  const moduleCode: Code[] = ['export default createTokenizerForRuleIterator(function(){'];

  const importsMap = new Map<string, Map<string | undefined, Var>>();

  valueMap.forEach((valueVar, value) => {
    if (!isImportedValue(value)) {
      moduleCode.push('var ', valueVar, '=', stringifyValue(value), ';');
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
    '}()', initialStageSrc, ');'
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

  moduleCode.unshift('import{createTokenizerForRuleIterator}from"tokenizer-dsl";');

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
