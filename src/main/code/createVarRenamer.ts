import {Var, VarRenamer} from './code-types';
import {encodeAlpha} from './encodeAlpha';

/**
 * Creates callback that returns a unique name for a variable.
 */
export function createVarRenamer(pins?: [Var, string][]): VarRenamer {
  const varMap = new Map(pins);

  return (v) => varMap.get(v) || varMap.set(v, encodeAlpha(varMap.size)).get(v)!;
}
