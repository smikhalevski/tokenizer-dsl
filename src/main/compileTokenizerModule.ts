import { compileRuleIteratorCodeBindings, createRuleTree, Rule } from './rules';
import { createVar, isImportedValue } from './utils';
import { assembleJs, Code, createVarRenamer, Var } from 'codedegen';

export function compileTokenizerModule<Type, Stage, Context>(rules: Rule<Type, Stage, Context>[]): string {

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

  if (varMap.size === 0) {
    return assembleJs(
      [
        'import{createTokenizerForRuleIterator}from"tokenizer-dsl";',
        'export default createTokenizerForRuleIterator(function(', argsSrc, '){return ', code, '};'
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

  moduleCode.unshift('import{createTokenizerForRuleIterator}from"tokenizer-dsl";');

  const moduleVarRenamer = (valueVar: Var) => varRenamer(varMap.has(valueVar) ? valueMap.get(varMap.get(valueVar))! : valueVar);

  return assembleJs(moduleCode, moduleVarRenamer);
}

function inverseMap<K, V>(map: Map<K, V>): Map<V, K> {
  return new Map(Array.from(map).map(([k, v]) => [v, k]));
}

function stringifyValue(value: any): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return JSON.stringify(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  throw new Error('Value cannot be serialized');
}
