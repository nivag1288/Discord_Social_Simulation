# Discord Social Simulation

A LLM-powered social simulation Discord app written in JavaScript. 30 AI-driven residents with distinct personalities react to emergency scenarios across multiple locations in a fictional coastal NC town (Manteo).

![Demo of App](social%20sim%20demo.gif)

## Project structure

```
├── .env.sample             -> sample .env file
├── app.js                  -> main entrypoint for app
├── bot_allocator.js        -> weighted random assignment of residents to locations
├── commands.js             -> slash command definitions (auto-synced with locations.js)
├── locations.js            -> location presets and helper functions
├── personalities.js        -> MBTI personality prompt templates
├── residents.js            -> 30 resident bot definitions
├── simulation_engine.js    -> simulation state management
├── utils.js                -> shared utilities (Discord API, security validation)
├── vitest.config.js        -> test configuration
├── __tests__/              -> test suite (7 files, 116 tests)
├── package.json
├── README.md
└── .gitignore
```

## Running app locally

Before you start, install [NodeJS](https://nodejs.org/en/download/) (>=18), [Ollama](https://ollama.com), and [Ngrok](https://ngrok.com/).

You also need to [create a Discord app](https://discord.com/developers/applications) with the following permissions:
- `applications.commands`
- `bot` (with Send Messages enabled)

Configuring the app is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Setup project

```bash
git clone https://github.com/nivag1288/Discord_Social_Simulation.git
cd Discord_Social_Simulation
npm install
```

### Configure environment variables

Copy `.env.sample` to `.env` and fill in all required values:

```
APP_ID=          # Discord application ID
DISCORD_TOKEN=   # Bot token
PUBLIC_KEY=      # Public key for request verification
MODEL=           # Ollama model name (e.g. gemma3:1b)
LOCAL_ENDPOINT=  # Ollama API URL (e.g. http://localhost:11434/api/generate)
```

The app validates all five variables at startup and exits with a clear error if any are missing.

### Install slash commands

```bash
npm run register
```

This registers `/test` (connection check) and `/simulate` with Discord. Location choices are generated automatically from `locations.js` — no manual sync needed.

### Start Ollama

Start Ollama on your local machine and pull the model you configured in `.env`:

```bash
ollama pull gemma3:1b
```

### Run the app

```bash
npm start
```

> Use `npm run dev` to run with `nodemon` for auto-restart on file changes.

### Set up interactivity

The app needs a public endpoint for Discord to reach. Use [`ngrok`](https://ngrok.com/) to tunnel local traffic:

```bash
ngrok http 3000
```

Copy the `https://...ngrok.io` forwarding URL, go to your [app's settings](https://discord.com/developers/applications), and paste it into **General Information → Interactions Endpoint URL**, appending `/interactions`:

```
https://1234-someurl.ngrok.io/interactions
```

Click **Save Changes** and the app is ready 🚀

---

## Running tests

The project uses [Vitest](https://vitest.dev/) for unit testing.

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests and generate a coverage report
npm run coverage
```

Coverage is enforced at **70% minimum** across lines, functions, branches, and statements (currently >98%). The HTML report is written to `coverage/index.html`.

Tests cover:
- `bot_allocator.js` — weight calculation, assignment algorithm, validation, stats
- `simulation_engine.js` — all state management functions, simulation creation
- `locations.js` — shuffle, capacity helpers, data integrity
- `utils.js` — Discord API helpers, `capitalize`, `getRandomEmoji`, `decodeHtmlEntities`, `validateMessageSecurity`
- `personalities.js` — all 16 MBTI types present and non-empty
- `residents.js` — 30 residents with valid fields, weights, and personality codes
- `commands.js` — location choices formula matches `LOCATION_PRESETS`

---

## Simulation

Run `/simulate` in your Discord server. A modal will open with:

- **Locations** (4–6): number of places residents gather. More locations = fewer residents per thread.  
  Locations are defined in `locations.js`. Adding a new entry there automatically adds it as a choice in the slash command.
- **Rounds** (1–7): number of conversation rounds after the initial response. More rounds = longer runtime.
- **Emergency message**: the scenario all residents react to (e.g. a hurricane warning, wildfire, flood). Each resident sees the message and responds based on their personality, role, and location.

The simulation posts a thread per location, runs all residents through each round, then saves a full transcript to `./Transcripts/<simulation-id>/`.

Resident personalities, location affinities, and MBTI types can all be customised in `residents.js` and `personalities.js`.

---

## Other resources
- [Discord Developer Documentation](https://discord.com/developers/docs/intro)
- [Ollama](https://ollama.com)
- [Vitest](https://vitest.dev/)
