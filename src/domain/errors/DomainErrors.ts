/**
 * Domain-specific error types.
 *
 * Each error extends the base Error class with a unique `code` for
 * programmatic handling in the application layer.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Thrown when AES-256-GCM decryption fails (wrong passphrase or corrupt data). */
export class DecryptionError extends DomainError {
  constructor(message = 'Decryption failed — wrong passphrase or corrupt data') {
    super(message, 'DECRYPTION_FAILED');
    this.name = 'DecryptionError';
  }
}

/** Thrown when a required entry is not found in storage. */
export class EntryNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Journal entry not found: ${id}`, 'ENTRY_NOT_FOUND');
    this.name = 'EntryNotFoundError';
  }
}

/** Thrown when entry validation fails (empty title, etc.). */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/** Thrown when the vault is locked and an operation requires an unlocked key. */
export class VaultLockedError extends DomainError {
  constructor() {
    super('Vault is locked — please unlock with your passphrase first', 'VAULT_LOCKED');
    this.name = 'VaultLockedError';
  }
}

/** Thrown when the AI adapter is not initialized or not available. */
export class AINotReadyError extends DomainError {
  constructor(provider: string) {
    super(`AI adapter (${provider}) is not ready — initialize it first`, 'AI_NOT_READY');
    this.name = 'AINotReadyError';
  }
}
