import {Var, VarRenamer} from './code-types';
import {encodeAlpha} from './encodeAlpha';

/**
 * Creates callback that returns a unique name for a variable.
 *
 * @param pinnedNames Var-name pairs that are predefined.
 * @returns The unique variable name.
 */
export function createVarRenamer(pinnedNames?: [Var, string][] | Iterable<[Var, string]>): VarRenamer {

  let index = 0;

  const map = new Map(pinnedNames);
  const names = new Set(map.values());

  return (v) => {
    let name = map.get(v);

    if (!name) {
      do {
        name = encodeAlpha(index++);
      } while (names.has(name));

      map.set(v, name);
    }

    return name;
  };
}
