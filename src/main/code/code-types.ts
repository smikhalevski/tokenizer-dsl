/**
 * The placeholder that denotes a variable reference in a code fragment.
 */
export type Var = symbol;

/**
 * The code fragment.
 */
export type Code = Code[] | Var | string | number | boolean | null | undefined;

export type Binding = [Var, unknown];
