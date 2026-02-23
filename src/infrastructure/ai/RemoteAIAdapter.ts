import type {
  IAIAdapter,
  AIGenerateRequest,
  AIGenerateResponse,
} from '@domain/interfaces/IAIAdapter';
import type { AIConfig } from '@domain/models/UserPreferences';

export class RemoteAIAdapter implements IAIAdapter {
  readonly provider = 'remote' as const;
  private endpoint = '';
  private apiKey = '';
  private model = '';

  async isReady(): Promise<boolean> {
    return this.endpoint !== '' && this.apiKey !== '';
  }

  async initialize(config: AIConfig): Promise<void> {
    this.endpoint = (config.remoteEndpoint ?? '').replace(/\/+$/, '');
    this.apiKey = config.remoteApiKey ?? '';
    this.model = config.remoteModel || 'gpt-4o-mini';
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Remote AI adapter not configured. Set endpoint and API key in Settings.');
    }

    const url = `${this.endpoint}/v1/chat/completions`;

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      max_tokens: request.maxTokens ?? 1500,
      temperature: request.temperature ?? 0.8,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('Network error — could not reach the AI endpoint. Check the URL and your connection.');
    }

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid API key. Check your credentials in Settings.');
      }
      if (res.status === 429) {
        throw new Error('Rate limited by the AI provider. Wait a moment and try again.');
      }
      const text = await res.text().catch(() => '');
      throw new Error(`AI request failed (${res.status}): ${text || res.statusText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data?.usage?.total_tokens ?? 0;

    if (!content) {
      throw new Error('AI returned an empty response. Try again or check your model configuration.');
    }

    return {
      content,
      tokensUsed,
      provider: 'remote',
      model: this.model,
    };
  }

  async dispose(): Promise<void> {
    // No resources to release for remote adapter
  }
}
