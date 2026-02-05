import { isVersionSupported } from './version';

describe('version', () => {
  describe('isVersionSupported', () => {
    const range = '>=1.0.0 <2.0.0';
    const check = isVersionSupported(range);

    it('returns true for supported versions', () => {
      expect(check('1.0.0')).toBe(true);
      expect(check('1.0.1')).toBe(true);
      expect(check('1.9.9')).toBe(true);
      expect(check('1.2.3-beta.1')).toBe(true);
    });

    it('returns false for unsupported versions', () => {
      expect(check('0.9.9')).toBe(false);
      expect(check('2.0.0')).toBe(false);
      expect(check('2.0.1')).toBe(false);
    });

    it('returns false for invalid semver strings', () => {
      expect(check('invalid')).toBe(false);
      expect(check('')).toBe(false);
      // @ts-expect-error Testing invalid input type
      expect(check(null)).toBe(false);
      // @ts-expect-error Testing invalid input type
      expect(check(undefined)).toBe(false);
    });
  });
});
