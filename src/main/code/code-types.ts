/**
 * The placeholder that denotes a variable reference in a code fragment.
 */
export type Var = symbol;

export interface Block {
  type: 'block';
  code: Code;
}

export interface VarAssign {
  type: 'varAssign';
  var: Var;
  code: Code;
}

export interface VarDeclare {
  type: 'varDeclare';
  var: Var;
  code?: Code;
}

/**
 * The code fragment.
 */
export type Code = Code[] | Var | Block | VarAssign | VarDeclare | string | number | boolean | null | undefined;

export type Binding = [Var, unknown];
