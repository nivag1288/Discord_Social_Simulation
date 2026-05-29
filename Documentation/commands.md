## Documentation for commands.js

Defines the Discord slash commands registered with the bot. Commands are synced to Discord at startup by `InstallGlobalCommands` in `app.js`.

---

# TEST_COMMAND

Used to verify the bot is reachable and responding.

```
/test
```

Returns:
```
Hello World <random emoji>
```

---

# SIMULATE_COMMAND

Opens a modal for configuring and launching an emergency simulation.

```
/simulate
```

The modal collects three inputs:

* **Number of locations** (4 – total presets)
  * Choices are generated automatically from `LOCATION_PRESETS` in `locations.js` — adding a new preset there adds a new choice here with no manual update to `commands.js`.
  * Each simulation needs a minimum of 4 locations so total max capacity is always ≥ 30 (enough room for all residents).

* **Number of rounds** (1 – 7)
  * Round 0 is the initial response to the emergency message.
  * Each additional round has every resident read the last 10 messages in their thread and reply again.
  * More rounds = longer runtime.
  * To add or remove round choices, update the `choices` array under `roundCount` in `SIMULATE_COMMAND`.

* **Emergency message**
  * The scenario all residents react to (e.g. a hurricane warning, wildfire, power outage).
  * Validated for XSS and SQL injection patterns before the simulation starts.

---

# ALL_COMMANDS

Array containing every command object (`TEST_COMMAND`, `SIMULATE_COMMAND`). This is what `InstallGlobalCommands` sends to Discord.

To register a new command:
1. Define the command object.
2. Add it to `ALL_COMMANDS`.
3. Run `npm run register`.
