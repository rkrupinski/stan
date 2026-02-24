import { validate, satisfies } from 'compare-versions';

export const isVersionSupported =
  (range: string) =>
  (version: string): boolean => {
    if (!validate(version)) return false;

    return satisfies(version, range);
  };
