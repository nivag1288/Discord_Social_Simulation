import 'dotenv/config';

export async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

// method to capitalize a string
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Decode HTML entities so encoded payloads (e.g. &#60;script&#62;) are caught by security checks
export function decodeHtmlEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

// Check an emergency message for XSS and injection attempts
// Returns { valid: boolean, errors: string[] }
export function validateMessageSecurity(message) {
  const errors = [];
  const lowerMessage = decodeHtmlEntities(message).toLowerCase();

  if (lowerMessage.includes('<script') || lowerMessage.includes('</script>')) {
    errors.push('Message contains script tags');
  }

  const eventHandlers = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'];
  for (const handler of eventHandlers) {
    if (lowerMessage.includes(handler)) {
      errors.push('Message contains event handlers');
      break;
    }
  }

  if (lowerMessage.includes('javascript:')) {
    errors.push('Message contains javascript protocol');
  }

  if (lowerMessage.includes('<iframe') || lowerMessage.includes('<embed') ||
      lowerMessage.includes('<object') || lowerMessage.includes('<svg')) {
    errors.push('Message contains potentially malicious HTML tags');
  }

  const sqlPatterns = ['drop table', 'delete from', 'insert into', 'update set', '1=1', '1\'=\'1'];
  for (const pattern of sqlPatterns) {
    if (lowerMessage.includes(pattern)) {
      errors.push('Message contains SQL-like injection patterns');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
