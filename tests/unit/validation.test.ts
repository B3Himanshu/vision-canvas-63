/**
 * Unit tests for validation functions
 */

import { describe, it, expect } from '@jest/globals';
import { validateString, validateId, validateCategory } from '../../backend/lib/validation';

describe('Validation functions', () => {
  describe('validateString', () => {
    it('should validate and return string', () => {
      expect(validateString('test', 10)).toBe('test');
    });

    it('should throw error for non-string input', () => {
      expect(() => validateString(123 as any, 10)).toThrow();
    });

    it('should throw error for string exceeding max length', () => {
      expect(() => validateString('a'.repeat(11), 10)).toThrow();
    });

    it('should remove null bytes', () => {
      expect(validateString('test\0string', 20)).toBe('teststring');
    });
  });

  describe('validateId', () => {
    it('should validate positive integer', () => {
      expect(validateId(1)).toBe(1);
      expect(validateId(100)).toBe(100);
    });

    it('should throw error for invalid IDs', () => {
      expect(() => validateId(0)).toThrow();
      expect(() => validateId(-1)).toThrow();
      expect(() => validateId(1.5)).toThrow();
      expect(() => validateId('invalid' as any)).toThrow();
    });
  });

  describe('validateCategory', () => {
    it('should validate valid categories', () => {
      expect(validateCategory('nature')).toBe('nature');
      expect(validateCategory('business')).toBe('business');
    });

    it('should throw error for invalid categories', () => {
      expect(() => validateCategory('invalid')).toThrow();
    });
  });
});
