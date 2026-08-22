export {};

declare global {
  interface ObjectConstructor {
    entries(o: Record<string, string>): [string, string][];
  }
}
