import { describe, it, expect } from 'vitest';
import { getHariFromTanggal } from '../../src/lib/absensiHelpers';

describe('absensiHelpers', () => {
  describe('getHariFromTanggal', () => {
    it('should return correct day string for a Monday', () => {
      expect(getHariFromTanggal('2026-07-27')).toBe('senin');
    });

    it('should return correct day string for a Sunday', () => {
      expect(getHariFromTanggal('2026-08-02')).toBe('minggu');
    });

    it('should work with Date object', () => {
      const date = new Date('2026-07-27T10:00:00Z');
      expect(getHariFromTanggal(date)).toBe('senin');
    });
  });
});
