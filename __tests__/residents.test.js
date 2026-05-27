import { describe, it, expect } from 'vitest';
import { TOWN_RESIDENTS } from '../residents.js';
import { personalities } from '../personalities.js';

const REQUIRED_FIELDS = [
  'name', 'emoji', 'role', 'personality',
  'locationAffinities', 'defaultLocationWeight', 'systemPrompt',
];

describe('TOWN_RESIDENTS', () => {
  it('has 30 residents', () => {
    expect(TOWN_RESIDENTS).toHaveLength(30);
  });

  it('each resident has all required fields', () => {
    for (const resident of TOWN_RESIDENTS) {
      for (const field of REQUIRED_FIELDS) {
        expect(resident, `${resident.name} missing field: ${field}`).toHaveProperty(field);
      }
    }
  });

  it('all resident names are unique', () => {
    const names = TOWN_RESIDENTS.map(r => r.name);
    expect(new Set(names).size).toBe(TOWN_RESIDENTS.length);
  });

  it('defaultLocationWeight is a number in [0, 1]', () => {
    for (const resident of TOWN_RESIDENTS) {
      expect(typeof resident.defaultLocationWeight, `${resident.name} weight type`).toBe('number');
      expect(resident.defaultLocationWeight).toBeGreaterThanOrEqual(0);
      expect(resident.defaultLocationWeight).toBeLessThanOrEqual(1);
    }
  });

  it('locationAffinities values are numbers in [0, 1]', () => {
    for (const resident of TOWN_RESIDENTS) {
      for (const [loc, weight] of Object.entries(resident.locationAffinities)) {
        expect(typeof weight, `${resident.name} affinity for "${loc}"`).toBe('number');
        expect(weight, `${resident.name} affinity for "${loc}" out of range`).toBeGreaterThanOrEqual(0);
        expect(weight, `${resident.name} affinity for "${loc}" out of range`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('each resident has a non-empty systemPrompt string', () => {
    for (const resident of TOWN_RESIDENTS) {
      expect(typeof resident.systemPrompt, `${resident.name} systemPrompt type`).toBe('string');
      expect(resident.systemPrompt.length, `${resident.name} systemPrompt empty`).toBeGreaterThan(0);
    }
  });

  it('each resident has a valid personalityCode', () => {
    const validCodes = new Set(Object.keys(personalities));
    for (const resident of TOWN_RESIDENTS) {
      expect(resident.personalityCode, `${resident.name} missing personalityCode`).toBeDefined();
      expect(validCodes.has(resident.personalityCode), `${resident.name} has unknown code: ${resident.personalityCode}`).toBe(true);
    }
  });

  it('each resident personality is a known personality value', () => {
    const validValues = new Set(Object.values(personalities));
    for (const resident of TOWN_RESIDENTS) {
      expect(validValues.has(resident.personality), `${resident.name} has unknown personality`).toBe(true);
    }
  });

  it('each resident has a non-empty role', () => {
    for (const resident of TOWN_RESIDENTS) {
      expect(typeof resident.role).toBe('string');
      expect(resident.role.length).toBeGreaterThan(0);
    }
  });
});
