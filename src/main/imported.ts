/**
 * Returns an imported value descriptor that can be serialized by {@link compileTokenizerModule}.
 */
export function imported(modulePath: string, exportName?: string): ImportedValue {
  return new ImportedValue(modulePath, exportName);
}

/**
 * Describes a value that should be imported from a module.
 */
export class ImportedValue {
  constructor(readonly modulePath: string, readonly exportName?: string) {
  }
}
