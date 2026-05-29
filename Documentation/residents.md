## Documentation for residents.js

Holds the 30 resident bot definitions and the global prompt constants shared across all of them.

---

# Exports

* **TOWN_RESIDENTS**
  * Array of 30 resident objects, each representing one AI-driven participant in the simulation.
  * Raw definitions use `personalityCode` (an MBTI key string such as `'ISFJ'`). At module load time a `.map()` derives two additional fields:
    * `personality` — the full MBTI prompt text looked up from `personalities.js` using `personalityCode`
    * `systemPrompt` — the resident's base system prompt with the personality text appended
  * This means adding or editing a personality in `personalities.js` automatically propagates to all residents that use it — no resident definition needs to change.

  * Example resident definition (as written in the source):
  ```js
  {
    name: '👵 Eleanor',
    emoji: '👵',
    role: 'elderly_disabled',
    personalityCode: 'ISFJ',
    locationAffinities: {
      'Beachside Library': 0.7,
      'Coastal Community Church': 0.5,
      'Main Street General Store': 0.4,
    },
    defaultLocationWeight: 0.25,
    systemPrompt: `You are Eleanor. ${FROM} You are elderly, and have a disability with high medical needs that makes you wheelchair bound. Mobility is difficult for you physically and with regards to transportation. When discussing situations, describe your understanding in a conversational way and mention your concerns about mobility and medical needs. ${RESPONSE_DETAIL}`
  }
  ```

  * Resident fields:
    * `name` (string) — display name including emoji prefix
    * `emoji` (string) — used in Discord messages
    * `role` (string) — descriptive role tag (e.g. `'elderly_disabled'`, `'parent'`)
    * `personalityCode` (string) — MBTI key (e.g. `'ISFJ'`); must match a key in `personalities.js`
    * `locationAffinities` (object) — map of location name → weight (0–1) for locations the resident prefers
    * `defaultLocationWeight` (number, 0–1) — fallback weight for any location not listed in `locationAffinities`
    * `systemPrompt` (string) — the LLM system prompt; the full personality text is appended automatically

---

# Global Constants

* **FROM**
  * `"You are a resident of Manteo, North Carolina."`
  * Shared backstory injected into every resident's system prompt. Change this to move the simulation to a different fictional location.

* **RESPONSE_DETAIL**
  * `"Keep responses relatively concise (2-4 sentences) and at most 2000 characters."`
  * Discord enforces a 2000-character limit per message. This constant keeps all residents within that limit.
