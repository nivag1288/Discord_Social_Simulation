import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateLocationWeights,
  assignBotsToLocations,
  validateAssignments,
  getAssignmentStats,
  printAssignmentSummary,
} from '../bot_allocator.js';

// Minimal test fixtures
const THREE_LOCATIONS = [
  { name: 'Loc A', capacity: { min: 1, max: 4 } },
  { name: 'Loc B', capacity: { min: 1, max: 4 } },
  { name: 'Loc C', capacity: { min: 1, max: 4 } },
];

function makeBots(n, overrides = {}) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Bot${i}`,
    emoji: '🤖',
    locationAffinities: {},
    defaultLocationWeight: 0.5,
    ...overrides,
  }));
}

// ────────────────────────────────────────────────────────────────
describe('calculateLocationWeights', () => {
  it('uses affinity when defined for a location', () => {
    const bot = { locationAffinities: { 'Loc A': 0.9 }, defaultLocationWeight: 0.2 };
    const weights = calculateLocationWeights(bot, THREE_LOCATIONS);
    expect(weights['Loc A']).toBe(0.9);
  });

  it('falls back to defaultLocationWeight when no affinity is specified', () => {
    const bot = { locationAffinities: {}, defaultLocationWeight: 0.3 };
    const weights = calculateLocationWeights(bot, THREE_LOCATIONS);
    expect(weights['Loc A']).toBe(0.3);
    expect(weights['Loc B']).toBe(0.3);
    expect(weights['Loc C']).toBe(0.3);
  });

  it('returns an entry for every supplied location', () => {
    const bot = { locationAffinities: { 'Loc A': 0.8 }, defaultLocationWeight: 0.2 };
    const weights = calculateLocationWeights(bot, THREE_LOCATIONS);
    expect(Object.keys(weights)).toHaveLength(THREE_LOCATIONS.length);
  });

  it('uses default weight for locations not in affinities', () => {
    const bot = { locationAffinities: { 'Loc A': 0.7 }, defaultLocationWeight: 0.1 };
    const weights = calculateLocationWeights(bot, THREE_LOCATIONS);
    expect(weights['Loc B']).toBe(0.1);
    expect(weights['Loc C']).toBe(0.1);
  });
});

// ────────────────────────────────────────────────────────────────
describe('assignBotsToLocations', () => {
  it('assigns every bot exactly once', () => {
    const bots = makeBots(6);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    const allAssigned = Object.values(assignments).flatMap(a => a.bots);
    expect(allAssigned).toHaveLength(6);
    expect(new Set(allAssigned.map(b => b.name)).size).toBe(6);
  });

  it('respects max capacity for each location', () => {
    const bots = makeBots(12); // 3 locations × max 4
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    for (const assignment of Object.values(assignments)) {
      expect(assignment.bots.length).toBeLessThanOrEqual(assignment.capacity.max);
    }
  });

  it('throws when bots exceed total max capacity', () => {
    const bots = makeBots(13); // 13 > 12 max
    expect(() => assignBotsToLocations(bots, THREE_LOCATIONS)).toThrow();
  });

  it('initialises every location in the assignments object', () => {
    const bots = makeBots(3);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    expect(Object.keys(assignments)).toHaveLength(THREE_LOCATIONS.length);
  });

  it('respects high-affinity preferences over many runs', () => {
    const locationsForBias = [
      { name: 'Preferred', capacity: { min: 1, max: 100 } },
      { name: 'Other', capacity: { min: 1, max: 100 } },
    ];
    const bots = Array.from({ length: 100 }, (_, i) => ({
      name: `B${i}`,
      locationAffinities: { Preferred: 0.99 },
      defaultLocationWeight: 0.01,
    }));
    const assignments = assignBotsToLocations(bots, locationsForBias);
    // With 0.99 affinity and enough capacity, the vast majority should land in Preferred
    expect(assignments['Preferred'].bots.length).toBeGreaterThan(60);
  });
});

// ────────────────────────────────────────────────────────────────
describe('validateAssignments', () => {
  it('returns valid:true for a correct assignment', () => {
    const bots = makeBots(6);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    const result = validateAssignments(assignments, bots, THREE_LOCATIONS);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags over-capacity locations as errors', () => {
    const bots = makeBots(3);
    const badAssignments = {
      'Loc A': { bots: bots, capacity: { min: 1, max: 2 } }, // 3 > max 2
      'Loc B': { bots: [], capacity: { min: 1, max: 4 } },
      'Loc C': { bots: [], capacity: { min: 1, max: 4 } },
    };
    const result = validateAssignments(badAssignments, bots, THREE_LOCATIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('over capacity'))).toBe(true);
  });

  it('flags missing bots as an error', () => {
    const bots = makeBots(4);
    // Only assign 3 of the 4 bots
    const assignments = assignBotsToLocations(makeBots(3), THREE_LOCATIONS);
    const result = validateAssignments(assignments, bots, THREE_LOCATIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Not all bots assigned'))).toBe(true);
  });

  it('produces warnings for under-minimum locations', () => {
    const bots = makeBots(1);
    const assignments = {
      'Loc A': { bots: [bots[0]], capacity: { min: 1, max: 4 } },
      'Loc B': { bots: [], capacity: { min: 1, max: 4 } }, // below min
      'Loc C': { bots: [], capacity: { min: 1, max: 4 } }, // below min
    };
    const result = validateAssignments(assignments, bots, THREE_LOCATIONS);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('flags duplicate bot assignments', () => {
    const bots = makeBots(2);
    const duplicateAssignments = {
      'Loc A': { bots: [bots[0], bots[0]], capacity: { min: 1, max: 4 } }, // duplicate
      'Loc B': { bots: [bots[1]], capacity: { min: 1, max: 4 } },
      'Loc C': { bots: [], capacity: { min: 1, max: 4 } },
    };
    const result = validateAssignments(duplicateAssignments, bots, THREE_LOCATIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('multiple locations'))).toBe(true);
  });

  it('flags missing locations in assignments', () => {
    const bots = makeBots(2);
    const incompleteAssignments = {
      'Loc A': { bots: bots, capacity: { min: 1, max: 4 } },
      // Loc B and Loc C missing
    };
    const result = validateAssignments(incompleteAssignments, bots, THREE_LOCATIONS);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing from assignments'))).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
describe('getAssignmentStats', () => {
  it('returns correct totalBots', () => {
    const bots = makeBots(6);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    const stats = getAssignmentStats(assignments);
    expect(stats.totalBots).toBe(6);
  });

  it('computes correct average bots per location', () => {
    const bots = makeBots(6);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    const stats = getAssignmentStats(assignments);
    expect(stats.avgBotsPerLocation).toBe(2);
  });

  it('minBots is <= maxBots', () => {
    const bots = makeBots(6);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    const stats = getAssignmentStats(assignments);
    expect(stats.minBots).toBeLessThanOrEqual(stats.maxBots);
  });

  it('locationCounts keys match location names', () => {
    const bots = makeBots(3);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    const stats = getAssignmentStats(assignments);
    for (const loc of THREE_LOCATIONS) {
      expect(stats.locationCounts).toHaveProperty(loc.name);
    }
  });
});

// ────────────────────────────────────────────────────────────────
describe('printAssignmentSummary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs without throwing', () => {
    const bots = makeBots(3);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    expect(() => printAssignmentSummary(assignments)).not.toThrow();
  });

  it('logs output to console', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const bots = makeBots(3);
    const assignments = assignBotsToLocations(bots, THREE_LOCATIONS);
    printAssignmentSummary(assignments);
    expect(spy).toHaveBeenCalled();
  });
});
