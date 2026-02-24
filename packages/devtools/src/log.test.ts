import { markFresh, consumeFresh, clearAllFresh } from './log';

beforeEach(() => {
  jest.useFakeTimers();
  clearAllFresh();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('freshEntries', () => {
  describe('markFresh + consumeFresh', () => {
    it('returns true for a freshly marked entry', () => {
      markFresh('1');
      expect(consumeFresh('1')).toBe(true);
    });

    it('returns false for an unknown entry', () => {
      expect(consumeFresh('unknown')).toBe(false);
    });
  });

  describe('single-use semantics', () => {
    it('returns false on second consume', () => {
      markFresh('1');
      expect(consumeFresh('1')).toBe(true);
      expect(consumeFresh('1')).toBe(false);
    });
  });

  describe('timeout expiry', () => {
    it('expires after 500ms', () => {
      markFresh('1');
      jest.advanceTimersByTime(500);
      expect(consumeFresh('1')).toBe(false);
    });

    it('is still fresh before 500ms', () => {
      markFresh('1');
      jest.advanceTimersByTime(499);
      expect(consumeFresh('1')).toBe(true);
    });
  });

  describe('clearAllFresh', () => {
    it('removes all entries', () => {
      markFresh('1');
      markFresh('2');
      markFresh('3');
      clearAllFresh();
      expect(consumeFresh('1')).toBe(false);
      expect(consumeFresh('2')).toBe(false);
      expect(consumeFresh('3')).toBe(false);
    });

    it('is idempotent', () => {
      markFresh('1');
      clearAllFresh();
      clearAllFresh();
      expect(consumeFresh('1')).toBe(false);
    });
  });

  describe('re-marking', () => {
    it('resets the timeout when marked again', () => {
      markFresh('1');
      jest.advanceTimersByTime(400);
      markFresh('1');
      jest.advanceTimersByTime(400);
      expect(consumeFresh('1')).toBe(true);
    });
  });
});
