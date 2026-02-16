import type {
  IAIAdapter,
  AIGenerateRequest,
  AIGenerateResponse,
} from '@domain/interfaces/IAIAdapter';
import type { AIConfig } from '@domain/models/UserPreferences';

export class MockAIAdapter implements IAIAdapter {
  readonly provider = 'local' as const;
  private ready = false;

  async isReady(): Promise<boolean> {
    return this.ready;
  }

  async initialize(_config: AIConfig): Promise<void> {
    this.ready = true;
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const theme = request.userPrompt.split('\n')[0] ?? 'my story';

    const content = [
      `There are seasons in life that quietly reshape who we are. This is one of those stories — a reflection on "${theme}".`,
      '',
      'It began in the way most meaningful things do: without fanfare, without a clear starting point. Just a series of ordinary days that, looking back, were anything but ordinary.',
      '',
      'The journal entries tell a story of someone in motion — processing, growing, sometimes struggling. There were mornings filled with intention and evenings heavy with reflection. Through it all, a thread of resilience runs quietly beneath the surface.',
      '',
      'What stands out most is the honesty. The willingness to sit with discomfort, to name feelings that are easier to ignore. That takes courage, even in a private journal.',
      '',
      'And then, gradually, something shifted. The tone changed. Not dramatically — life rarely works that way — but enough to notice. A lightness crept in. New perspectives emerged. Old patterns were questioned, and some were gently released.',
      '',
      'This is what growth looks like in real time: messy, non-linear, and deeply human. The entries don\'t tell a perfect story, and that\'s exactly what makes them powerful.',
      '',
      'Looking at this chapter as a whole, one thing is clear: you showed up. Day after day, you showed up — for yourself, for the process, for the possibility of something better. That matters more than any single moment.',
    ].join('\n');

    return {
      content,
      tokensUsed: 280,
      provider: 'local',
      model: 'mock-narrative-v1',
    };
  }

  async dispose(): Promise<void> {
    this.ready = false;
  }
}
