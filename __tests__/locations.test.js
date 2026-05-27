import { describe, it, expect } from 'vitest';
import { LOCATION_PRESETS, getLocationByName, getRandomLocations, getTotalCapacity } from '../locations.js';

describe('LOCATION_PRESETS', () => {
  it('has 6 locations', () => {
    expect(LOCATION_PRESETS).toHaveLength(6);
  });

  it('each location has required fields', () => {
    for (const loc of LOCATION_PRESETS) {
      expect(loc).toHaveProperty('name');
      expect(loc).toHaveProperty('type');
      expect(loc).toHaveProperty('emoji');
      expect(loc).toHaveProperty('description');
      expect(loc.capacity).toHaveProperty('min');
      expect(loc.capacity).toHaveProperty('max');
    }
  });

  it('each location has valid capacity range', () => {
    for (const loc of LOCATION_PRESETS) {
      expect(loc.capacity.min).toBeGreaterThan(0);
      expect(loc.capacity.max).toBeGreaterThanOrEqual(loc.capacity.min);
    }
  });

  it('all location names are unique', () => {
    const names = LOCATION_PRESETS.map(l => l.name);
    expect(new Set(names).size).toBe(LOCATION_PRESETS.length);
  });
});

describe('getLocationByName', () => {
  it('returns the matching location', () => {
    const loc = getLocationByName('The Dockside Diner');
    expect(loc).toBeDefined();
    expect(loc.name).toBe('The Dockside Diner');
  });

  it('returns undefined for an unknown name', () => {
    expect(getLocationByName('Nonexistent Place')).toBeUndefined();
  });

  it('returns the correct location object', () => {
    const loc = getLocationByName('Beachside Library');
    expect(loc.emoji).toBe('📚');
    expect(loc.capacity.min).toBe(4);
    expect(loc.capacity.max).toBe(7);
  });
});

describe('getRandomLocations', () => {
  it('returns the requested number of locations', () => {
    expect(getRandomLocations(4)).toHaveLength(4);
    expect(getRandomLocations(6)).toHaveLength(6);
  });

  it('returns no duplicate locations', () => {
    const locs = getRandomLocations(6);
    const names = locs.map(l => l.name);
    expect(new Set(names).size).toBe(6);
  });

  it('returns only locations from LOCATION_PRESETS', () => {
    const presetNames = new Set(LOCATION_PRESETS.map(l => l.name));
    const locs = getRandomLocations(4);
    for (const loc of locs) {
      expect(presetNames.has(loc.name)).toBe(true);
    }
  });

  it('throws when count exceeds available locations', () => {
    expect(() => getRandomLocations(7)).toThrow();
  });

  it('returns varied subsets across multiple calls', () => {
    const runs = Array.from({ length: 20 }, () =>
      getRandomLocations(4).map(l => l.name).sort().join(',')
    );
    expect(new Set(runs).size).toBeGreaterThan(1);
  });
});

describe('getTotalCapacity', () => {
  it('sums min and max correctly', () => {
    const locs = [
      { capacity: { min: 4, max: 8 } },
      { capacity: { min: 5, max: 10 } },
    ];
    const total = getTotalCapacity(locs);
    expect(total.min).toBe(9);
    expect(total.max).toBe(18);
  });

  it('returns zero totals for an empty array', () => {
    const total = getTotalCapacity([]);
    expect(total.min).toBe(0);
    expect(total.max).toBe(0);
  });

  it('works with a single location', () => {
    const total = getTotalCapacity([{ capacity: { min: 3, max: 7 } }]);
    expect(total.min).toBe(3);
    expect(total.max).toBe(7);
  });
});
