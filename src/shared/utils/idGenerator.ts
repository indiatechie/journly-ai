/**
 * ID generation utility.
 *
 * Uses the `uuid` package for UUIDv4 generation.
 * Centralised here so we can swap implementations easily (e.g., nanoid).
 */

import { v4 as uuidv4 } from 'uuid';

/** Generate a new UUIDv4 string. */
export function generateId(): string {
  return uuidv4();
}
