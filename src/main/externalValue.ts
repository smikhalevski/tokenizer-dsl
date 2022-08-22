/**
 * Returns an external value descriptor that can be serialized by {@link compileRuleIteratorModule}.
 */
export function externalValue(modulePath: string, exportName?: string): ExternalValue {
  return new ExternalValue(modulePath, exportName);
}

/**
 * Describes a value that should be imported from a module.
 */
export class ExternalValue {
  constructor(readonly modulePath: string, readonly exportName?: string) {
  }
}
