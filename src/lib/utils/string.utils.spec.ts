import { ucfirst } from './string.utils';

describe('String Utils', () => {
  describe('ucfirst', () => {
    it('should capitalize the first letter of a lowercase string', () => {
      expect(ucfirst('hello')).toBe('Hello');
    });

    it('should keep the first letter capitalized if already uppercase', () => {
      expect(ucfirst('Hello')).toBe('Hello');
    });

    it('should handle single character strings', () => {
      expect(ucfirst('a')).toBe('A');
      expect(ucfirst('A')).toBe('A');
    });

    it('should handle empty string', () => {
      expect(ucfirst('')).toBe('');
    });

    it('should handle strings with mixed case', () => {
      expect(ucfirst('hELLO')).toBe('HELLO');
    });

    it('should handle strings starting with numbers', () => {
      expect(ucfirst('123abc')).toBe('123abc');
    });

    it('should handle strings starting with special characters', () => {
      expect(ucfirst('!hello')).toBe('!hello');
      expect(ucfirst('@world')).toBe('@world');
    });

    it('should handle strings with spaces', () => {
      expect(ucfirst('hello world')).toBe('Hello world');
    });

    it('should handle strings starting with whitespace', () => {
      expect(ucfirst(' hello')).toBe(' hello');
    });
  });
});