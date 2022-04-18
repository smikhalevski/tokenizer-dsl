import {Code, CodeType, Var} from './code-types';

export const enum Direction {
  BACKWARDS = -1,
  FORWARDS = 1,
}

export function walkChildren(children: Code[], index: number, direction: Direction, walker: (child: Exclude<Code, Code[]>, index: number, children: Code[]) => boolean | void): boolean {
  for (let i = index; direction === Direction.FORWARDS ? i < children.length : i > -1; i += direction) {

    const child = children[i];

    if (
        Array.isArray(child)
            ? !walkChildren(child, direction === Direction.FORWARDS ? 0 : child.length - 1, direction, walker)
            : walker(child, i, children) === false
            || child
            && typeof child === 'object'
            && child.children
            && !walkChildren(child.children, direction === Direction.FORWARDS ? 0 : child.children.length - 1, direction, walker)
    ) {
      return false;
    }
  }
  return true;
}

export function countVarRefs(children: Code[], index: number, v: Var): number {
  let refCount = 0;
  walkChildren(children, index, Direction.FORWARDS, (child) => typeof child !== 'symbol' || child !== v || ++refCount !== 2);
  return refCount;
}

export function inlineVars(children: Code[]): Code[] {
  walkChildren(children, children.length - 1, Direction.BACKWARDS, (child, index, children) => {

    if (!child || typeof child !== 'object' || child.type !== CodeType.VAR_ASSIGN || child.retained) {
      return;
    }

    const refCount = countVarRefs(children, index + 1, child.var);
    if (refCount === 2) {
      return;
    }

    children[index] = '';

    if (refCount === 0) {
      return;
    }
    walkChildren(children, index + 1, Direction.FORWARDS, (otherChild, index, children) => {
      if (!otherChild || typeof otherChild !== 'symbol' || otherChild !== child.var) {
        return;
      }
      children[index] = child.children;
      return false;
    });
  });
  return children;
}
