import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatPercentage } from '../utils';

describe('cn (className utility)', () => {
    it('merges class names', () => {
        expect(cn('text-white', 'font-bold')).toBe('text-white font-bold');
    });

    it('handles conditional classes', () => {
        expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
    });

    it('deduplicates tailwind classes', () => {
        const result = cn('text-red-500', 'text-blue-500');
        expect(result).toBe('text-blue-500');
    });
});

describe('formatCurrency', () => {
    it('formats positive values', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats zero', () => {
        expect(formatCurrency(0)).toBe('$0.00');
    });

    it('formats large numbers', () => {
        expect(formatCurrency(1_000_000)).toBe('$1,000,000.00');
    });

    it('formats small decimal values', () => {
        expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('formats negative values', () => {
        const result = formatCurrency(-500);
        expect(result).toContain('500.00');
    });
});

describe('formatPercentage', () => {
    it('formats decimal as percentage', () => {
        expect(formatPercentage(0.05)).toBe('5.00%');
    });

    it('formats zero', () => {
        expect(formatPercentage(0)).toBe('0.00%');
    });

    it('formats 100%', () => {
        expect(formatPercentage(1)).toBe('100.00%');
    });

    it('formats small percentages', () => {
        expect(formatPercentage(0.001)).toBe('0.10%');
    });
});
