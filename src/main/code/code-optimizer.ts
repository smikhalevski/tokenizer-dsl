import {Code, Var} from './code-types';

export const enum WalkDirection {
  BACKWARDS = -1,
  FORWARDS = 1,
}

export function walkChildren(children: Code[], index: number, direction: WalkDirection, walker: (child: Exclude<Code, Code[]>, index: number, children: Code[]) => boolean | void): boolean {
  for (let i = index; direction === WalkDirection.FORWARDS ? i < children.length : i > -1; i += direction) {

    const child = children[i];

    if (
        Array.isArray(child)
            ? !walkChildren(child, direction === WalkDirection.FORWARDS ? 0 : child.length - 1, direction, walker)
            : walker(child, i, children) === false
            || child
            && typeof child === 'object'
            && child.value
            && !walkChildren(child.value, direction === WalkDirection.FORWARDS ? 0 : child.value.length - 1, direction, walker)
    ) {
      return false;
    }
  }
  return true;
}

export function countVarRefs(children: Code[], index: number, v: Var): number {
  let refCount = 0;
  walkChildren(children, index, WalkDirection.FORWARDS, (child) => {
    return typeof child !== 'symbol' || child !== v || ++refCount !== 2;
  });
  return refCount;
}

export function inlineVarAssignments(children: Code[]): void {
  walkChildren(children, children.length - 1, WalkDirection.BACKWARDS, (child, index, children) => {
    if (!child || typeof child !== 'object' || child.type !== 'varAssign' || child.retained) {
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
    walkChildren(children, index + 1, WalkDirection.FORWARDS, (otherChild, index, children) => {
      if (!otherChild || typeof otherChild !== 'symbol' || otherChild !== child.var) {
        return;
      }
      children[index] = child.value;
      return false;
    });
  });
}
