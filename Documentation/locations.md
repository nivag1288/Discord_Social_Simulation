## Documentation for locations.js

Holds the list of preset locations and helper functions for working with them. All locations are based on a fictional coastal NC town (Manteo).

---

# Exports

* **LOCATION_PRESETS**
  * Array of all available location objects. Currently 6 presets.
  * Adding a new object to this array automatically makes it available as a `/simulate` choice — no changes to `commands.js` are needed.
  * Example location:
  ```js
  {
    name: 'The Dockside Diner',
    type: 'commercial',
    capacity: { min: 6, max: 10 },
    description: 'Local breakfast and lunch spot near the marina where locals gather for coffee and conversation',
    emoji: '☕'
  }
  ```
  * Fields:
    * `name` (string) — unique identifier used throughout the simulation
    * `type` (string) — location category (e.g. `'commercial'`, `'civic'`, `'residential'`)
    * `capacity.min` (number) — minimum number of residents expected at this location
    * `capacity.max` (number) — maximum number of residents that can be assigned here
    * `description` (string) — plain-English description included in each resident's prompt
    * `emoji` (string) — displayed in Discord thread names and summaries

* **getLocationByName(locationName)**
  * Looks up a location in `LOCATION_PRESETS` by its `name` field (exact match).
  * Input: `locationName` (string)
  * Output: location object, or `undefined` if not found

* **getRandomLocations(count)**
  * Returns `count` locations chosen at random from `LOCATION_PRESETS` with no duplicates.
  * Uses a Fisher-Yates shuffle for a statistically uniform distribution — all orderings are equally likely, which avoids the selection bias of a sort-based shuffle.
  * Throws `Error` if `count` is greater than the total number of presets.
  * Input: `count` (number)
  * Output: array of `count` location objects

* **getTotalCapacity(locations)**
  * Sums the `capacity.min` and `capacity.max` values across a list of locations.
  * Used by `createSimulation` to check whether there is enough room for all 30 residents.
  * Input: `locations` (array of location objects)
  * Output: `{ min: number, max: number }`
