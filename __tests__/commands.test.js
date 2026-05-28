import { describe, it, expect } from 'vitest';
import { LOCATION_PRESETS } from '../locations.js';

// The minimum location count is a domain constraint: 4 locations always have
// enough total max capacity (≥30) for all 30 TOWN_RESIDENTS.
const MIN_LOCATIONS = 4;

// Mirror the formula used in commands.js so we can assert its correctness
// independently of the Discord registration side-effect.
function buildLocationChoices(presets, min) {
  return Array.from(
    { length: presets.length - min + 1 },
    (_, i) => {
      const n = min + i;
      return { name: `${n} location${n > 1 ? 's' : ''}`, value: n };
    }
  );
}

describe('locationChoices (commands.js formula)', () => {
  const choices = buildLocationChoices(LOCATION_PRESETS, MIN_LOCATIONS);

  it('produces one choice per valid location count', () => {
    expect(choices).toHaveLength(LOCATION_PRESETS.length - MIN_LOCATIONS + 1);
  });

  it('starts at the minimum location count', () => {
    expect(choices[0].value).toBe(MIN_LOCATIONS);
  });

  it('ends at the total number of available locations', () => {
    expect(choices[choices.length - 1].value).toBe(LOCATION_PRESETS.length);
  });

  it('each choice value matches its position in the sequence', () => {
    choices.forEach((choice, i) => {
      expect(choice.value).toBe(MIN_LOCATIONS + i);
    });
  });

  it('choice names are correctly pluralised', () => {
    for (const choice of choices) {
      if (choice.value === 1) {
        expect(choice.name).toBe('1 location');
      } else {
        expect(choice.name).toBe(`${choice.value} locations`);
      }
    }
  });

  it('adding a preset would automatically add one more choice', () => {
    const extraPreset = { name: 'New Place', capacity: { min: 3, max: 6 } };
    const expanded = buildLocationChoices([...LOCATION_PRESETS, extraPreset], MIN_LOCATIONS);
    expect(expanded).toHaveLength(choices.length + 1);
    expect(expanded[expanded.length - 1].value).toBe(LOCATION_PRESETS.length + 1);
  });
});
