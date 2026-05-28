import { describe, it, expect } from 'vitest';
import {
  createSimulation,
  getSimulationStats,
  updateSimulationStatus,
  setLocationThreadId,
  getLocationThreadId,
  incrementMessageCount,
  setLocationRound,
  completeRound,
  getBotsAtLocation,
  formatSimulationSummary,
  formatCompletionSummary,
} from '../simulation_engine.js';

// Build a minimal simulation fixture without going through createSimulation,
// so that state-mutator tests are fast, deterministic, and have no external deps.
function makeSimulation(overrides = {}) {
  return {
    id: 'sim_test_abc1234',
    status: 'created',
    emergencyMessage: 'Wildfire approaching — evacuate immediately.',
    roundCount: 3,
    createdAt: 1_000_000,
    locations: [
      {
        name: 'The Dockside Diner',
        emoji: '☕',
        type: 'commercial',
        capacity: { min: 2, max: 5 },
        description: 'Test diner',
        threadId: null,
        bots: [{ name: 'BotA', emoji: '🤖' }, { name: 'BotB', emoji: '🤖' }],
        messageCount: 0,
        currentRound: 0,
        transcript: null,
      },
      {
        name: 'Beachside Library',
        emoji: '📚',
        type: 'public',
        capacity: { min: 2, max: 5 },
        description: 'Test library',
        threadId: null,
        bots: [{ name: 'BotC', emoji: '🤖' }],
        messageCount: 0,
        currentRound: 0,
        transcript: null,
      },
    ],
    stats: {
      totalBots: 3,
      totalLocations: 2,
      totalRounds: 3,
      messagesPosted: 0,
      roundsCompleted: 0,
    },
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────
describe('createSimulation', () => {
  it('returns a simulation with the correct top-level shape', () => {
    const sim = createSimulation(4, 3, 'Test emergency');
    // ID should be sim_ followed by a UUID (crypto.randomUUID format)
    expect(sim.id).toMatch(/^sim_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(sim.status).toBe('created');
    expect(sim.emergencyMessage).toBe('Test emergency');
    expect(sim.roundCount).toBe(3);
    expect(sim.locations).toHaveLength(4);
    expect(sim.stats.totalBots).toBe(30);
    expect(sim.stats.totalLocations).toBe(4);
    expect(sim.stats.totalRounds).toBe(3);
  });

  it('distributes all 30 residents across locations', () => {
    const sim = createSimulation(4, 3, 'Test');
    const total = sim.locations.reduce((s, l) => s + l.bots.length, 0);
    expect(total).toBe(30);
  });

  it('each location has a null threadId initially', () => {
    const sim = createSimulation(4, 2, 'Test');
    for (const loc of sim.locations) {
      expect(loc.threadId).toBeNull();
    }
  });

  it('each location starts at round 0 with 0 messages', () => {
    const sim = createSimulation(4, 2, 'Test');
    for (const loc of sim.locations) {
      expect(loc.currentRound).toBe(0);
      expect(loc.messageCount).toBe(0);
    }
  });
});

// ────────────────────────────────────────────────────────────────
describe('getSimulationStats', () => {
  it('returns stats matching the simulation', () => {
    const sim = makeSimulation();
    const stats = getSimulationStats(sim);
    expect(stats.totalBots).toBe(3);
    expect(stats.totalLocations).toBe(2);
    expect(stats.locationBreakdown).toHaveLength(2);
  });

  it('locationBreakdown has correct botCount per location', () => {
    const sim = makeSimulation();
    const stats = getSimulationStats(sim);
    const diner = stats.locationBreakdown.find(l => l.name === 'The Dockside Diner');
    const library = stats.locationBreakdown.find(l => l.name === 'Beachside Library');
    expect(diner.botCount).toBe(2);
    expect(library.botCount).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────
describe('updateSimulationStatus', () => {
  it('updates the status field', () => {
    const sim = makeSimulation();
    updateSimulationStatus(sim, 'running');
    expect(sim.status).toBe('running');
  });

  it('sets completedAt when status is "complete"', () => {
    const sim = makeSimulation();
    updateSimulationStatus(sim, 'complete');
    expect(sim.completedAt).toBeDefined();
    expect(typeof sim.completedAt).toBe('number');
  });

  it('does not set completedAt for non-complete statuses', () => {
    const sim = makeSimulation();
    updateSimulationStatus(sim, 'running');
    expect(sim.completedAt).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────
describe('setLocationThreadId / getLocationThreadId', () => {
  it('round-trips the thread ID correctly', () => {
    const sim = makeSimulation();
    setLocationThreadId(sim, 'The Dockside Diner', 'thread-123');
    expect(getLocationThreadId(sim, 'The Dockside Diner')).toBe('thread-123');
  });

  it('returns null before a thread ID is set', () => {
    const sim = makeSimulation();
    expect(getLocationThreadId(sim, 'The Dockside Diner')).toBeNull();
  });

  it('setLocationThreadId throws on unknown location', () => {
    const sim = makeSimulation();
    expect(() => setLocationThreadId(sim, 'Unknown Place', 'x')).toThrow();
  });

  it('getLocationThreadId throws on unknown location', () => {
    const sim = makeSimulation();
    expect(() => getLocationThreadId(sim, 'Unknown Place')).toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
describe('incrementMessageCount', () => {
  it('increments location messageCount by 1 by default', () => {
    const sim = makeSimulation();
    incrementMessageCount(sim, 'The Dockside Diner');
    expect(sim.locations[0].messageCount).toBe(1);
  });

  it('increments location messageCount by the given amount', () => {
    const sim = makeSimulation();
    incrementMessageCount(sim, 'The Dockside Diner', 5);
    expect(sim.locations[0].messageCount).toBe(5);
  });

  it('increments stats.messagesPosted', () => {
    const sim = makeSimulation();
    incrementMessageCount(sim, 'The Dockside Diner', 3);
    expect(sim.stats.messagesPosted).toBe(3);
  });

  it('throws on unknown location', () => {
    const sim = makeSimulation();
    expect(() => incrementMessageCount(sim, 'Unknown Place', 1)).toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
describe('setLocationRound', () => {
  it('sets currentRound on the correct location', () => {
    const sim = makeSimulation();
    setLocationRound(sim, 'The Dockside Diner', 2);
    expect(sim.locations[0].currentRound).toBe(2);
  });

  it('throws on unknown location', () => {
    const sim = makeSimulation();
    expect(() => setLocationRound(sim, 'Unknown Place', 1)).toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
describe('completeRound', () => {
  it('increments roundsCompleted by 1', () => {
    const sim = makeSimulation();
    completeRound(sim);
    expect(sim.stats.roundsCompleted).toBe(1);
  });

  it('accumulates across multiple calls', () => {
    const sim = makeSimulation();
    completeRound(sim);
    completeRound(sim);
    completeRound(sim);
    expect(sim.stats.roundsCompleted).toBe(3);
  });
});

// ────────────────────────────────────────────────────────────────
describe('getBotsAtLocation', () => {
  it('returns the bots array for a known location', () => {
    const sim = makeSimulation();
    const bots = getBotsAtLocation(sim, 'The Dockside Diner');
    expect(bots).toHaveLength(2);
    expect(bots[0].name).toBe('BotA');
  });

  it('throws on unknown location', () => {
    const sim = makeSimulation();
    expect(() => getBotsAtLocation(sim, 'Unknown Place')).toThrow();
  });
});

// ────────────────────────────────────────────────────────────────
describe('formatSimulationSummary', () => {
  it('contains the simulation ID', () => {
    const sim = makeSimulation();
    expect(formatSimulationSummary(sim)).toContain('sim_test_abc1234');
  });

  it('contains the EMERGENCY label', () => {
    const sim = makeSimulation();
    expect(formatSimulationSummary(sim)).toContain('EMERGENCY');
  });

  it('truncates emergency messages longer than 150 chars', () => {
    const sim = makeSimulation({ emergencyMessage: 'A'.repeat(200) });
    expect(formatSimulationSummary(sim)).toContain('...');
  });

  it('does not truncate short emergency messages', () => {
    const sim = makeSimulation({ emergencyMessage: 'Short message' });
    const text = formatSimulationSummary(sim);
    // The full message should appear uncut (not followed by ellipsis)
    expect(text).toContain('Short message');
    expect(text).not.toMatch(/Short message\.\.\./);
  });
});

// ────────────────────────────────────────────────────────────────
describe('formatCompletionSummary', () => {
  it('contains the SIMULATION COMPLETE label', () => {
    const sim = makeSimulation();
    updateSimulationStatus(sim, 'complete');
    expect(formatCompletionSummary(sim)).toContain('SIMULATION COMPLETE');
  });

  it('shows 0 seconds when completedAt is not set', () => {
    const sim = makeSimulation();
    expect(formatCompletionSummary(sim)).toContain('0 seconds');
  });

  it('shows a non-zero duration when completedAt is set', () => {
    const sim = makeSimulation({ createdAt: 1_000_000, completedAt: 1_060_000 });
    expect(formatCompletionSummary(sim)).toContain('60 seconds');
  });

  it('truncates long emergency messages', () => {
    const sim = makeSimulation({ emergencyMessage: 'B'.repeat(200), completedAt: 1_001_000 });
    expect(formatCompletionSummary(sim)).toContain('...');
  });
});
