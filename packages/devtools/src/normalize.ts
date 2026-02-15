type Brand<T, B extends string> = T & { __brand: B };

export type NormalizedString = Brand<string, 'normalizedString'>;

export const normalizeString = (input: string): NormalizedString =>
  input.trim().toLowerCase() as NormalizedString;
