## Documentation for simulation_engine.js

Creates and manages town emergency simulations. Combines location selection, bot allocation, and simulation state into a single object that is passed through the full simulation lifecycle in `app.js`.

---

# Exports

* **createSimulation(locationCount, roundCount, emergencyMessage)**
  * Builds a new simulation object from user input.
  * Selects `locationCount` random locations (no duplicates), assigns all 30 residents to those locations via `assignBotsToLocations`, validates the assignments, and returns the fully initialised simulation.
  * Throws if the total max capacity of the selected locations is less than the number of residents, or if assignment validation fails.
  * Input: `locationCount` (number), `roundCount` (number), `emergencyMessage` (string)
  * Output: simulation object (see shape below)

* **getSimulationStats(simulation)**
  * Summarises the current simulation state.
  * Input: `simulation`
  * Output: `{ totalBots, totalLocations, totalRounds, messagesPosted, roundsCompleted, locationBreakdown }`
    * `locationBreakdown` — array of `{ name, emoji, botCount, messageCount }` per location

* **updateSimulationStatus(simulation, status)**
  * Sets `simulation.status` to the given value (`'created'`, `'running'`, `'complete'`, `'error'`).
  * Also stamps `simulation.completedAt` (milliseconds) when status is `'complete'`.
  * Input: `simulation`, `status` (string)

* **setLocationThreadId(simulation, locationName, threadId)**
  * Records the Discord thread ID for a location once the thread is created.
  * Throws if `locationName` is not found in the simulation.
  * Input: `simulation`, `locationName` (string), `threadId` (string)

* **incrementMessageCount(simulation, locationName, count = 1)**
  * Increments both `location.messageCount` and `simulation.stats.messagesPosted` by `count`.
  * Throws if `locationName` is not found in the simulation.
  * Input: `simulation`, `locationName` (string), `count` (number, default 1)

* **setLocationRound(simulation, locationName, roundNumber)**
  * Sets `location.currentRound` to track which round each location is currently processing.
  * Throws if `locationName` is not found in the simulation.
  * Input: `simulation`, `locationName` (string), `roundNumber` (number)

* **completeRound(simulation)**
  * Increments `simulation.stats.roundsCompleted` by 1.
  * Input: `simulation`

* **getBotsAtLocation(simulation, locationName)**
  * Returns the array of resident objects assigned to the given location.
  * Throws if `locationName` is not found in the simulation.
  * Input: `simulation`, `locationName` (string)
  * Output: array of bot objects

* **getLocationThreadId(simulation, locationName)**
  * Returns the Discord thread ID for the given location, or `null` if the thread has not been created yet.
  * Throws if `locationName` is not found in the simulation.
  * Input: `simulation`, `locationName` (string)
  * Output: string | null

* **formatSimulationSummary(simulation)**
  * Builds the initial Discord message shown when a simulation starts (emergency text, locations list, resident count, round count).
  * Emergency messages longer than 150 characters are truncated with `...`.
  * Input: `simulation`
  * Output: formatted string

* **formatCompletionSummary(simulation)**
  * Builds the Discord message shown after a simulation finishes (per-location message counts, total messages, rounds completed, duration in seconds).
  * Input: `simulation`
  * Output: formatted string

---

# Helper Functions

* **generateSimulationId()**
  * Generates a collision-proof simulation ID using `crypto.randomUUID()` (built into Node ≥ 18).
  * Output: string in the form `sim_<uuid>` (e.g. `sim_550e8400-e29b-41d4-a716-446655440000`)

---

# Simulation Object Shape

```js
{
  id: 'sim_<uuid>',
  emergencyMessage: '...',
  roundCount: 3,
  status: 'created',          // created | running | complete | error
  createdAt: 1700000000000,   // Date.now()
  completedAt: 1700000300000, // set by updateSimulationStatus('complete')
  locations: [
    {
      name: 'The Dockside Diner',
      emoji: '☕',
      type: 'commercial',
      capacity: { min: 6, max: 10 },  // shallow copy, not a shared reference
      description: '...',
      threadId: null,           // filled by setLocationThreadId
      bots: [ /* resident objects */ ],
      messageCount: 0,
      currentRound: 0,
      transcript: null          // filled by app.js after each round
    },
    // ...
  ],
  stats: {
    totalBots: 30,
    totalLocations: 4,
    totalRounds: 3,
    messagesPosted: 0,
    roundsCompleted: 0
  }
}
```
