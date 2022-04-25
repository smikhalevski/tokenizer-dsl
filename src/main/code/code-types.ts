/**
 * The placeholder that denotes a variable reference in a code fragment.
 */
export type Var = symbol;

export enum CodeType {
  VAR_DECLARE,
  VAR_ASSIGN,
}

export interface VarDeclare {
  type: CodeType.VAR_DECLARE;
  var: Var;
  children: Code[];
  retained: boolean;
}

export interface VarAssign {
  type: CodeType.VAR_ASSIGN;
  var: Var;
  children: Code[];
  retained: boolean;
}

/**
 * The code fragment.
 */
export type Code = Code[] | Var | VarDeclare | VarAssign | string | number | boolean | null | undefined;

/**
 * Var-value pair.
 */
export type Binding = [Var, unknown];

/**
 * Returns the unique variable name.
 */
export type VarRenamer = (v: Var) => string;

export interface CodeBindings {
  code: Code;
  bindings?: Binding[];
}
