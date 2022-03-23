import {InternalTaker, TakerCodeFactory} from './taker-types';

export const enum NodeType {
  CODE,
  VAR,
}

export type Node = CodeNode | VarNode;

export type CodeChild = Node | string | number | boolean;

export type Code = Code[] | CodeChild;

export interface CodeNode {
  type: NodeType.CODE;
  children: CodeChild[];

  push(...code: Code[]): this;
}

export interface VarNode {
  type: NodeType.VAR;
}

export function js(...code: Code[]): CodeNode {
  return {
    type: NodeType.CODE,
    children: flatCode(code),
    push,
  };
}

export function createVar(): VarNode {
  return {type: NodeType.VAR};
}

function push(this: CodeNode, ...code: Code[]): CodeNode {
  this.children.push(...flatCode(code));
  return this;
}

export function flatCode(code: Code[]): CodeChild[] {
  let result: CodeChild[] | undefined = undefined;

  for (let i = 0; i < code.length; ++i) {
    const item = code[i];

    let arr;
    if (Array.isArray(item)) {
      arr = flatCode(item);
    } else if (typeof item === 'object' && item.type === NodeType.CODE) {
      arr = item.children;
    } else if (result) {
      result.push(item);
    }
    if (arr) {
      result ||= code.slice(0, i) as CodeChild[];
      result.push(...arr);
    }
  }

  return result || code as CodeChild[];
}

/**
 * Encodes an integer part of a non-negative number as a string of ASCII lower  alpha characters.
 *
 * ```ts
 * encodeLetters(100); // → 'cw'
 * ```
 *
 * @param value The non-negative integer number to encode as lower alpha string.
 */
export function encodeLowerAlpha(value: number): string {
  let str = '';

  do {
    str = String.fromCharCode(97 + value % 26) + str;
    value = value / 26 | 0;
  } while (value-- !== 0);

  return str;
}

export function compileCode(child: CodeChild, vars: VarNode[] = []): string {

  if (typeof child !== 'object') {
    return String(child);
  }

  switch (child.type) {

    case NodeType.CODE:
      let str = '';
      for (let i = 0; i < child.children.length; ++i) {
        str += compileCode(child.children[i], vars);
      }
      return str;

    case NodeType.VAR:
      const varIndex = vars.indexOf(child);

      return encodeLowerAlpha(varIndex === -1 ? vars.push(child) - 1 : varIndex);
  }
}

export function createTaker<T extends InternalTaker>(type: T['__type'], factory: TakerCodeFactory, values: [VarNode, unknown][] = []): T {

  const valuesVar = createVar();
  const node = js();

  for (let i = 0; i < values.length; ++i) {
    node.push('var ', values[i][0], '=', valuesVar, '[', i, '];');
  }

  const inputVar = createVar();
  const offsetVar = createVar();
  const returnVar = createVar();

  node.push(
      'return function(', inputVar, ',', offsetVar, '){',
      'var ', returnVar, ';',
      factory(inputVar, offsetVar, returnVar),
      'return ', returnVar,
      '}',
  );

  const vars: VarNode[] = [];
  const src = compileCode(node, vars);

  const taker: T = values.length === 0 ? Function(src)() : Function(encodeLowerAlpha(vars.indexOf(valuesVar)), src)(values.map(([, value]) => value));

  taker.__type = type;
  taker.__factory = factory;
  taker.__values = values;

  return taker;
}
