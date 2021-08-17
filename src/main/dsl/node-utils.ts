import {Taker} from '../types';

export const enum NodeType {
  TEXT_CASE_SENSITIVE,
  TEXT_CASE_INSENSITIVE,
  CHAR_CASE_SENSITIVE,
  CHAR_CODE_CHECKER,
}

export const enum NodeProperty {
  TYPE = '__t',
  VALUE = '__v',
}

export interface INode extends Taker {
  [NodeProperty.TYPE]: NodeType;
  [NodeProperty.VALUE]: any;
}

export function createNode(type: NodeType, value: unknown, taker: Taker): Taker {
  (taker as INode)[NodeProperty.TYPE] = type;
  (taker as INode)[NodeProperty.VALUE] = value;
  return taker;
}

export function isNode(taker: Taker, type: NodeType): taker is INode {
  return (taker as INode)[NodeProperty.TYPE] === type;
}
