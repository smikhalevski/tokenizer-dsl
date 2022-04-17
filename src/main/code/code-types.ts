/**
 * The placeholder that denotes a variable reference in a code fragment.
 */
export type Var = symbol;

export interface VarAssign {
  type: 'varAssign';
  var: Var;
  value: Code[];
  retained: boolean;
}

export interface VarDeclare {
  type: 'varDeclare';
  var: Var;
  value: Code[];
  retained: boolean;
}

/**
 * The code fragment.
 */
export type Code = Code[] | Var | VarAssign | VarDeclare | string | number | boolean | null | undefined;

export type Binding = [Var, unknown];

/**
 * Returns the unique variable name.
 */
export type VarRenamer = (v: Var) => string;
