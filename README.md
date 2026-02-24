# Getting Started app for Discord

This project contains a LLM powered Social Simulation Discord app written in JavaScript, based on the [getting started guide](https://discord.com/developers/docs/getting-started) from Discord.


## Project structure
Below is a basic overview of the project structure:

```
├── .env.sample -> sample .env file
├── app.js      -> main entrypoint for app
├── bot_allocator.js    -> utility functions for allocating bots to locations
├── commands.js -> slash command payloads + helpers
├── locations.js    -> locations bots are allocated to
├── residents.js    -> list of bot personalities
├── simulation_engine.js    -> runs the simulation
├── utils.js    -> utility functions and enums
├── package.json
├── README.md
└── .gitignore
```

## Running app locally

Before you start, you'll need to install [NodeJS](https://nodejs.org/en/download/) and [create a Discord app](https://discord.com/developers/applications) with the proper permissions:
- `applications.commands`
- `bot` (with Send Messages enabled)

You will also need to install [Ollama](https://ollama.com) and [Ngrok](https://ngrok.com/?homepage-cta-docs=control)

Configuring the app is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Setup project

First clone the project:
```
git clone https://github.com/nivag1288/Discord_Social_Simulation.git
```

Then navigate to its directory and install dependencies:
```
cd Discord_Social_Simulation
npm install
```
### Get app credentials

Fetch the credentials from your app's settings and add them to a `.env` file (see `.env.sample` for an example). You'll need your app ID (`APP_ID`), bot token (`DISCORD_TOKEN`), and public key (`PUBLIC_KEY`).

Fetching credentials is covered in detail in the [getting started guide](https://discord.com/developers/docs/getting-started).

### Install slash commands

The commands for the app are set up in `commands.js`. All the commands in the `ALL_COMMANDS` array at the bottom of `commands.js` will be installed when you run the `register` command configured in `package.json`:
Currently there are two commands, '/test' for simple connection testing, and '/simulate' to run the simulation

```
npm run register
```

### Start Olamma

Start Ollama on your local machine and make sure the model is: `gemma3:1b`



### Run the app

After your credentials are added, go ahead and run the app:

```
npm start
```

> ⚙️ A package [like `nodemon`](https://github.com/remy/nodemon), which watches for local changes and restarts your app, may be helpful while locally developing.


### Set up interactivity

The project needs a public endpoint where Discord can send requests. To develop and test locally, you can use something like [`ngrok`](https://ngrok.com/) to tunnel HTTP traffic.

Start listening on port `3000`:

```
ngrok http 3000
```

You should see your connection open:

```
Tunnel Status                 online
Version                       2.0/2.0
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://1234-someurl.ngrok.io -> localhost:3000

Connections                  ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

Copy the forwarding address that starts with `https`, in this case `https://1234-someurl.ngrok.io`, then go to your [app's settings](https://discord.com/developers/applications).

On the **General Information** tab, there will be an **Interactions Endpoint URL**. Paste your ngrok address there, and append `/interactions` to it (`https://1234-someurl.ngrok.io/interactions` in the example).

Click **Save Changes**, and your app should be ready to run 🚀

## Simulation
The simulation can be run in your Discord Server with '/simulate'. This will open a multi-modal input allowing the user to chose:
* The number of **locations**: 4 - 6
  * The more locations the more places to allocate the bots, so less bots per location. 
  * Locations can be found in `locations.js`. Adding more locations to the list means you have to add more options in `commands.js`
  * Bots have weighting for 3 locations based on the chance they would be in that location based on their personality. 
    * For example, Elanor an older women is more likey to be in church, the grocery store, or the library. She has a default weight to go to the other locations
* The number of **rounds**: 1 - 10
  * 1 round is an initial response from the bots to your message, then 1 message from each responding to eachother in a specific location
  * More rounds means more responses, higher rounds will increase runtime
* after hitting enter, the user can type in their **error message** and start the simulation
  * all bots see error message and respond 

## Other resources
- Read **[the documentation](https://discord.com/developers/docs/intro)** for in-depth information about API features.
