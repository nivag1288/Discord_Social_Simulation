import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { capitalize, getRandomEmoji, DiscordRequest, InstallGlobalCommands } from '../utils.js';

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
