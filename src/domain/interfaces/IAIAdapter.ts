/**
 * AI adapter interface.
 *
 * Abstracts local (WebLLM) and remote (OpenAI-compatible) AI providers
 * behind a single contract. The application layer uses this interface
 * without knowing which provider is active.
 */

import type { AIConfig } from '../models/UserPreferences';

export type AIProviderKind = 'local' | 'remote';

export interface AIGenerateRequest {
  /** System-level instructions for the AI. */
  systemPrompt: string;
  /** User-level prompt (includes journal content). */
  userPrompt: string;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** Sampling temperature (0 = deterministic, 1 = creative). */
  temperature?: number;
}

export interface AIGenerateResponse {
  /** The generated text content. */
  content: string;
  /** Approximate token count used. */
  tokensUsed: number;
  /** Which provider produced this response. */
  provider: AIProviderKind;
  /** Model identifier used. */
  model: string;
}

export interface IAIAdapter {
  /** Which provider this adapter represents. */
  readonly provider: AIProviderKind;

  /** Check if the adapter is initialized and ready to serve requests. */
  isReady(): Promise<boolean>;

  /** Initialize the adapter (e.g., load a local model). */
  initialize(config: AIConfig): Promise<void>;

  /** Generate a completion from a prompt. */
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;

  /** Release resources (e.g., unload model from memory). */
  dispose(): Promise<void>;
}
