import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemoteAIAdapter } from './RemoteAIAdapter';

const MOCK_CONFIG = {
  provider: 'remote' as const,
  remoteEndpoint: 'https://api.example.com',
  remoteApiKey: 'sk-test-key',
  remoteModel: 'gpt-4o-mini',
};

const MOCK_REQUEST = {
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Tell me a story.',
};

function makeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

describe('RemoteAIAdapter', () => {
  let adapter: RemoteAIAdapter;

  beforeEach(() => {
    adapter = new RemoteAIAdapter();
    vi.restoreAllMocks();
  });

  it('throws "not configured" error when endpoint/key are missing', async () => {
    await expect(adapter.generate(MOCK_REQUEST)).rejects.toThrow('not configured');
  });

  it('throws "Invalid API key" on HTTP 401', async () => {
    await adapter.initialize(MOCK_CONFIG);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeResponse(401, {}));

    await expect(adapter.generate(MOCK_REQUEST)).rejects.toThrow('Invalid API key');
  });

  it('throws "Rate limited" on HTTP 429', async () => {
    await adapter.initialize(MOCK_CONFIG);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeResponse(429, {}));

    await expect(adapter.generate(MOCK_REQUEST)).rejects.toThrow('Rate limited');
  });

  it('throws "Network error" on fetch rejection', async () => {
    await adapter.initialize(MOCK_CONFIG);
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(adapter.generate(MOCK_REQUEST)).rejects.toThrow('Network error');
  });

  it('throws "empty response" when choices array is empty', async () => {
    await adapter.initialize(MOCK_CONFIG);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeResponse(200, { choices: [], usage: { total_tokens: 0 } }),
    );

    await expect(adapter.generate(MOCK_REQUEST)).rejects.toThrow('empty response');
  });

  it('returns { content, provider: "remote" } on success', async () => {
    await adapter.initialize(MOCK_CONFIG);
    const responseBody = {
      choices: [{ message: { content: 'Once upon a time...' } }],
      usage: { total_tokens: 50 },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(makeResponse(200, responseBody));

    const result = await adapter.generate(MOCK_REQUEST);
    expect(result.content).toBe('Once upon a time...');
    expect(result.provider).toBe('remote');
    expect(result.tokensUsed).toBe(50);
  });
});
