/**
 * Application-wide constants.
 */

/** Application metadata */
export const APP_NAME = 'Journly.ai';
export const APP_VERSION = '1.0.0';

/** Crypto defaults */
export const PBKDF2_ITERATIONS = 600_000;
export const SALT_BYTE_LENGTH = 16;
export const IV_BYTE_LENGTH = 12;
export const AES_KEY_LENGTH = 256;

/** Storage keys */
export const IDB_DATABASE_NAME = 'journly-ai-db';
export const IDB_VERSION = 1;
export const PREFERENCES_STORAGE_KEY = 'journly-preferences';

/** Validation limits */
export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 100_000; // ~100K chars
export const MIN_PASSPHRASE_LENGTH = 8;

/** AI defaults */
export const DEFAULT_MAX_TOKENS = 1024;
export const DEFAULT_TEMPERATURE = 0.7;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
