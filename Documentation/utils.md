## Documentation for utils.js

Shared utility functions used across the app. Includes Discord API helpers, security validation, and string utilities.

Originally based on the Discord example app: https://github.com/discord/discord-example-app

Discord Documentation: https://docs.discord.com/developers/quick-start/getting-started

# Exports

* **DiscordRequest(endpoint, options)**
  * Makes an authenticated request to the Discord REST API (v10)
  * Automatically JSON-stringifies `options.body` and attaches the bot token header
  * Throws on any non-2xx response
  * Input: endpoint (string), options (fetch options object)
  * Output: fetch Response

* **InstallGlobalCommands(appId, commands)**
  * Bulk-overwrites global slash commands via the Discord API
  * Errors are logged but not re-thrown (safe to call at startup)
  * Input: appId (string), commands (array of command objects)

* **getRandomEmoji()**
  * Returns a random emoji from a small fixed list
  * Output: emoji string

* **capitalize(str)**
  * Capitalises the first character of a string, leaving the rest unchanged
  * Input: str (string)
  * Output: string

* **decodeHtmlEntities(str)**
  * Decodes HTML entities so encoded payloads are not used to bypass security checks
  * Handles decimal numeric (`&#60;`), hex numeric (`&#x3c;`), and named (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&apos;`) entities
  * Input: str (string)
  * Output: decoded string

* **validateMessageSecurity(message)**
  * Checks an emergency message for XSS and SQL injection patterns
  * Decodes HTML entities before checking so encoded attacks are caught
  * Checks for: `<script>` tags, event handlers (`onclick`, `onerror`, `onload`, etc.), `javascript:` protocol, `<iframe>` / `<embed>` / `<object>` / `<svg>` tags, and common SQL injection patterns
  * Input: message (string)
  * Output: `{ valid: boolean, errors: string[] }`
