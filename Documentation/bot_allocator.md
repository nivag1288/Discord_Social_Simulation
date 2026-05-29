## Documentation for bot_allocator.js

File responsible for allocating bots to the location list for each simulation.
Bots = Residents — the wording is interchangeable throughout the documentation.
Simulations won't always use all locations in the preset list.

# Exports

* **calculateLocationWeights(bot, locations)**
  * Calculates a weight for each location for a given bot based on the bot's `locationAffinities` map (from `residents.js`).
  * If the location name is in the bot's `locationAffinities`, that value is used; otherwise `defaultLocationWeight` is used.
  * Input: `bot` (resident object), `locations` (array of location objects for this simulation run)
  * Output: `weights` — object mapping location name → raw weight value

* **assignBotsToLocations(bots, locations)**
  * Assigns each bot to exactly one location using a greedy weighted-random strategy.
  * For each bot: calculates weights, normalises to probabilities, then picks a location via `selectLocationByProbability`. If the chosen location is full, falls back to the first location with remaining capacity.
  * Input: `bots` (array of residents), `locations` (array of locations for this simulation)
  * Output: `assignments` — object mapping location name → `{ location, bots[] }`

* **validateAssignments(assignments, bots, locations)**
  * Verifies correctness of a completed assignment:
    * Every bot is assigned exactly once (no duplicates, no missing bots)
    * No location exceeds its `capacity.max`
  * Input: `assignments`, `bots`, `locations`
  * Output: `{ valid: boolean, errors: string[] }`

* **printAssignmentSummary(assignments)**
  * Logs a formatted summary of the assignment to the console (location name, bot count, bot names).
  * Input: `assignments`

* **getAssignmentStats(assignments)**
  * Computes aggregate statistics for a completed assignment.
  * Input: `assignments`
  * Output:
    * `totalBots` — total number of assigned bots
    * `locationCount` — number of locations
    * `avgBotsPerLocation` — mean bots per location
    * `minBots` — fewest bots in any location
    * `maxBots` — most bots in any location

---

# Helper Functions

* **normalizeToProbabilities(weights)**
  * Converts raw weights to probabilities that sum to 1.
  * Throws if all weights are zero (no valid assignment is possible).
  * Input: `weights` (object mapping name → number)
  * Output: `probabilities` (object mapping name → number in [0, 1])

* **selectLocationByProbability(probabilities)**
  * Picks a location name by sampling from the probability distribution.
  * Uses a cumulative-sum walk; the last bucket is always returned if floating-point rounding leaves the sum just below 1.0 — this prevents the silent wrong-fallback that biased assignment away from the last entry.
  * Input: `probabilities`
  * Output: location name (string)

* **isLocationAtCapacity(assignments, location)**
  * Returns `true` if the number of bots already assigned to a location equals or exceeds `location.capacity.max`.
  * Input: `assignments`, `location`
  * Output: boolean
