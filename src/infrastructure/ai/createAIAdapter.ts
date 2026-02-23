import type { IAIAdapter } from '@domain/interfaces/IAIAdapter';
import type { AIConfig } from '@domain/models/UserPreferences';
import { MockAIAdapter } from './MockAIAdapter';
import { RemoteAIAdapter } from './RemoteAIAdapter';

export function createAIAdapter(config: AIConfig): IAIAdapter {
  if (config.provider === 'remote') {
    return new RemoteAIAdapter();
  }
  // 'none' and 'local' (deferred to v2) both fall back to mock
  return new MockAIAdapter();
}
