## Documentation for app.js

Main entrypoint for the Discord Social Simulation bot. Starts an Express server, handles Discord interaction events (slash commands and modals), and orchestrates the full simulation lifecycle.

---

# Startup

On launch the app checks that all five required environment variables are present and exits immediately with a clear error message if any are missing:

```
DISCORD_TOKEN   – bot token used to authenticate Discord API calls
APP_ID          – Discord application ID
PUBLIC_KEY      – used to verify incoming request signatures
MODEL           – Ollama model name (e.g. gemma3:1b)
LOCAL_ENDPOINT  – Ollama API URL (e.g. http://localhost:11434/api/generate)
```

Global slash commands are registered automatically at startup via `InstallGlobalCommands`.

---

# Express Routes

* **GET /**
  * Health-check endpoint; returns `"👋"`.

* **POST /interactions**
  * Receives all Discord interaction payloads.
  * Verifies the Ed25519 request signature using `PUBLIC_KEY`; returns `401` if invalid.
  * Routes to the PING handler, slash command handler, or modal handler based on `interaction.type` and `interaction.data`.

---

# Slash Command Handlers

* **`/test`**
  * Responds immediately with `"Hello World"` and a random emoji.

* **`/simulate`**
  * Opens the simulation setup modal (location count, round count, emergency message inputs).

---

# Modal Handler (simulation setup)

When the user submits the `/simulate` modal:

1. Parses and validates `locationCount` (integer, 4–total presets) and `roundCount` (integer, 1–7); rejects with an ephemeral error on invalid input.
2. Runs `validateMessageSecurity` on the emergency message; rejects with an ephemeral error listing any violations.
3. Sends an immediate `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE` acknowledgement.
4. Calls `createSimulation` to build the simulation object (random locations, bot assignments, unique UUID-based ID).
5. Posts an initial status message to the channel and stores the message ID for later edits.
6. Builds a permanent update endpoint (`channels/{channelId}/messages/{messageId}`) so status edits are not limited by the 15-minute interaction token expiry.
7. Creates one Discord thread per location, then runs all conversation rounds:
   * **Round 0 (initial response):** every resident at a location receives the emergency message and responds.
   * **Rounds 1–N:** every resident reads the last 10 messages in the thread and adds a follow-up response.
8. After all rounds, saves a transcript file per location to `./Transcripts/{simulationId}/`.
9. Edits the main channel message to show the completion summary.

Any unhandled error during the simulation is caught; the main channel message is updated with an error notice. If the error occurs before the message ID is known, the interaction webhook fallback URL is used instead.

---

# Key Helpers

* **`callOllama(prompt, systemPrompt, retries = 3)`**
  * Sends a generation request to the Ollama API (`LOCAL_ENDPOINT`) using the configured `MODEL`.
  * On network error or bad response, retries up to 3 times with 1 s / 2 s exponential backoff before re-throwing.
  * Returns the model's response string, or `'No response'` if the body is empty.

* **`safeUpdateMessage(endpoint, content)`**
  * Wrapper around `DiscordRequest` for editing an existing message.
  * Catches errors silently so a failed status update never crashes the simulation.

* **`createMyFolder(path)`** / **`createFileAsync(path, content)`**
  * Async file system helpers for creating the transcript directory and writing per-location transcript files.
  * Both are `await`-ed to ensure writes complete before the simulation finishes.

---

# State

* **`activeSimulations`** — a `Map` keyed by simulation ID. Entries are added at creation and deleted after completion (or on error), preventing unbounded memory growth across many runs.
