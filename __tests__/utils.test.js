import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  capitalize, getRandomEmoji, DiscordRequest, InstallGlobalCommands,
  decodeHtmlEntities, validateMessageSecurity,
} from '../utils.js';

const KNOWN_EMOJIS = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];

// ────────────────────────────────────────────────────────────────
describe('capitalize', () => {
  it('capitalizes the first letter of a lowercase string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles an empty string without throwing', () => {
    expect(capitalize('')).toBe('');
  });

  it('leaves an already-capitalized string unchanged', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('capitalizes a single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('capitalizes only the first letter, leaving the rest as-is', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });
});

// ────────────────────────────────────────────────────────────────
describe('getRandomEmoji', () => {
  it('returns a value from the known emoji list', () => {
    expect(KNOWN_EMOJIS).toContain(getRandomEmoji());
  });

  it('returns varied results across 50 calls', () => {
    const results = new Set(Array.from({ length: 50 }, () => getRandomEmoji()));
    expect(results.size).toBeGreaterThan(1);
  });
});

// ────────────────────────────────────────────────────────────────
describe('DiscordRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the response object on a successful request', async () => {
    const mockResponse = { ok: true };
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const result = await DiscordRequest('channels/123/messages', { method: 'GET' });
    expect(result).toBe(mockResponse);
  });

  it('includes the correct Discord API base URL', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true });
    await DiscordRequest('channels/123', { method: 'GET' });

    const calledUrl = vi.mocked(fetch).mock.calls[0][0];
    expect(calledUrl).toContain('discord.com/api/v10/channels/123');
  });

  it('sends the Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true });
    await DiscordRequest('channels/123', { method: 'GET' });

    const calledOptions = vi.mocked(fetch).mock.calls[0][1];
    expect(calledOptions.headers.Authorization).toMatch(/^Bot /);
  });

  it('throws when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: '401: Unauthorized' }),
    });

    await expect(DiscordRequest('channels/123', { method: 'GET' })).rejects.toThrow();
  });

  it('JSON-stringifies an options body before sending', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true });
    const options = { method: 'POST', body: { content: 'hello' } };
    await DiscordRequest('channels/123/messages', options);

    const calledOptions = vi.mocked(fetch).mock.calls[0][1];
    expect(typeof calledOptions.body).toBe('string');
    expect(JSON.parse(calledOptions.body)).toEqual({ content: 'hello' });
  });
});

// ────────────────────────────────────────────────────────────────
describe('decodeHtmlEntities', () => {
  it('decodes decimal numeric entities', () => {
    expect(decodeHtmlEntities('&#60;script&#62;')).toBe('<script>');
  });

  it('decodes hex numeric entities', () => {
    expect(decodeHtmlEntities('&#x3c;script&#x3e;')).toBe('<script>');
  });

  it('decodes named entities', () => {
    expect(decodeHtmlEntities('&lt;b&gt;&amp;&quot;&apos;')).toBe('<b>&"\'');
  });

  it('leaves plain text unchanged', () => {
    expect(decodeHtmlEntities('Hurricane warning!')).toBe('Hurricane warning!');
  });

  it('handles mixed plain text and entities', () => {
    expect(decodeHtmlEntities('Alert: &lt;danger&gt;')).toBe('Alert: <danger>');
  });
});

// ────────────────────────────────────────────────────────────────
describe('validateMessageSecurity', () => {
  it('accepts a clean emergency message', () => {
    const result = validateMessageSecurity('Hurricane Category 4 approaching. Evacuate immediately.');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects messages with <script> tags', () => {
    expect(validateMessageSecurity('<script>alert(1)</script>').valid).toBe(false);
  });

  it('rejects case-variant script tags', () => {
    expect(validateMessageSecurity('<SCRIPT>alert(1)</SCRIPT>').valid).toBe(false);
  });

  it('rejects HTML-entity-encoded script tags', () => {
    expect(validateMessageSecurity('&#60;script&#62;alert(1)&#60;/script&#62;').valid).toBe(false);
  });

  it('rejects messages with event handlers', () => {
    expect(validateMessageSecurity('<img onerror="alert(1)">').valid).toBe(false);
  });

  it('rejects messages with javascript: protocol', () => {
    expect(validateMessageSecurity('javascript:alert(1)').valid).toBe(false);
  });

  it('rejects iframe tags', () => {
    expect(validateMessageSecurity('<iframe src="evil.com">').valid).toBe(false);
  });

  it('rejects SVG tags (can carry onload handlers)', () => {
    expect(validateMessageSecurity('<svg onload="alert(1)">').valid).toBe(false);
  });

  it('rejects SQL injection patterns', () => {
    expect(validateMessageSecurity("'; DROP TABLE residents; --").valid).toBe(false);
  });

  it('returns a non-empty errors array for invalid messages', () => {
    const result = validateMessageSecurity('<script>bad</script>');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────
describe('InstallGlobalCommands', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the correct bulk-overwrite endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true });
    await InstallGlobalCommands('12345', []);

    const calledUrl = vi.mocked(fetch).mock.calls[0][0];
    expect(calledUrl).toContain('applications/12345/commands');
  });

  it('does not throw even if DiscordRequest fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server Error' }),
    });

    await expect(InstallGlobalCommands('12345', [])).resolves.not.toThrow();
  });
});
