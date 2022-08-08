export class ImportedValue {
  constructor(readonly modulePath: string, readonly exportName?: string) {
  }
}

export function imported(modulePath: string, exportName?: string): ImportedValue {
  return new ImportedValue(modulePath, exportName);
}
