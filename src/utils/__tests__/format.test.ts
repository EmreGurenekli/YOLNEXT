import { describe, it } from '@jest/globals';
import { formatCurrency, formatDate } from '../format';

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1500)).toBe('₺1.500,00');
      expect(formatCurrency(100)).toBe('₺100,00');
      expect(formatCurrency(0)).toBe('₺0,00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-500)).toBe('-₺500,00');
      expect(formatCurrency(-0.5)).toBe('-₺0,50');
    });

    it('handles decimal numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('₺1.234,56');
      expect(formatCurrency(0.5)).toBe('₺0,50');
      expect(formatCurrency(0.99)).toBe('₺0,99');
    });

    it('handles string inputs', () => {
      expect(formatCurrency('1500')).toBe('₺1.500,00');
      expect(formatCurrency('1234.56')).toBe('₺1.234,56');
    });

    it('handles invalid inputs gracefully', () => {
      expect(formatCurrency(null as any)).toBe('₺0,00');
      expect(formatCurrency(undefined as any)).toBe('₺0,00');
      expect(formatCurrency('' as any)).toBe('₺0,00');
      expect(formatCurrency('invalid' as any)).toBe('₺0,00');
      expect(formatCurrency(NaN)).toBe('₺0,00');
    });

    it('handles very large numbers', () => {
      expect(formatCurrency(1000000)).toBe('₺1.000.000,00');
      expect(formatCurrency(999999999.99)).toBe('₺999.999.999,99');
    });
  });

  describe('formatDate', () => {
    it('formats date strings correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('formats Date objects correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('handles different format modes', () => {
      const date = '2024-01-15T10:30:00Z';
      
      expect(formatDate(date, 'short')).toMatch(/\d{2}\.\d{2}\.\d{4}/);
      expect(formatDate(date, 'long')).toMatch(/\d{1,2}\s[A-Za-zğüşıöç]+\s\d{4}/);
      expect(formatDate(date, 'time')).toMatch(/\d{2}:\d{2}/);
    });

    it('handles invalid dates gracefully', () => {
      expect(formatDate(null as any)).toBe('');
      expect(formatDate(undefined as any)).toBe('');
      expect(formatDate('' as any)).toBe('');
      expect(formatDate('invalid-date' as any)).toBe('');
      expect(formatDate('2024-13-45' as any)).toBe('');
    });

    it('handles edge cases', () => {
      // Leap year
      expect(formatDate('2024-02-29T00:00:00Z')).toBeTruthy();
      
      // Start of epoch
      expect(formatDate('1970-01-01T00:00:00Z')).toBeTruthy();
      
      // Far future date
      expect(formatDate('2099-12-31T23:59:59Z')).toBeTruthy();
    });

    it('handles timezone differences', () => {
      const utcDate = '2024-01-15T00:00:00Z';
      const formatted = formatDate(utcDate);
      
      // Should format according to local timezone
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('preserves immutability', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const originalTime = date.getTime();
      
      formatDate(date);
      
      // Original date should not be modified
      expect(date.getTime()).toBe(originalTime);
    });
  });

  describe('formatCurrency edge cases', () => {
    it('handles very small decimal numbers', () => {
      expect(formatCurrency(0.001)).toBe('₺0,00');
      expect(formatCurrency(0.009)).toBe('₺0,01');
    });

    it('handles rounding correctly', () => {
      expect(formatCurrency(2.555)).toBe('₺2,56');
      expect(formatCurrency(2.554)).toBe('₺2,55');
    });

    it('handles scientific notation', () => {
      expect(formatCurrency(1e6)).toBe('₺1.000.000,00');
      expect(formatCurrency(1.23e-3)).toBe('₺0,00');
    });
  });

  describe('formatDate edge cases', () => {
    it('handles ISO 8601 formats', () => {
      const isoDate = '2024-01-15T10:30:00.123Z';
      const formatted = formatDate(isoDate);
      expect(formatted).toBeTruthy();
    });

    it('handles different date string formats', () => {
      const formats = [
        '2024-01-15',
        '2024/01/15',
        '01/15/2024',
        '15-01-2024',
      ];
      
      formats.forEach(format => {
        const formatted = formatDate(format);
        // Some formats might not be valid, but should not crash
        expect(typeof formatted).toBe('string');
      });
    });
  });
});
