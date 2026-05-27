import { describe, it, expect } from 'vitest';
import { personalities } from '../personalities.js';

const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

describe('personalities', () => {
  it('contains all 16 MBTI types', () => {
    for (const type of MBTI_TYPES) {
      expect(personalities, `Missing personality type: ${type}`).toHaveProperty(type);
    }
  });

  it('has exactly 16 entries', () => {
    expect(Object.keys(personalities)).toHaveLength(16);
  });

  it('each value is a non-empty string', () => {
    for (const [key, value] of Object.entries(personalities)) {
      expect(typeof value, `${key} value should be string`).toBe('string');
      expect(value.length, `${key} value should not be empty`).toBeGreaterThan(0);
    }
  });

  it('each type description mentions the type name', () => {
    for (const [key, value] of Object.entries(personalities)) {
      expect(value, `${key} description should contain type key`).toContain(key);
    }
  });
});
