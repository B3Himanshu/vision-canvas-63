/**
 * Unit tests for utility functions
 * Run with: npm test
 */

import { describe, it, expect } from '@jest/globals';
import { cn } from '../../src/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class');
  });

  it('should handle false conditions', () => {
    const isActive = false;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should resolve conflicts
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
