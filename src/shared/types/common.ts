/**
 * Shared type definitions used across layers.
 */

/** Generic async operation result */
export type AsyncResult<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** Helper to create a success result */
export function ok<T>(data: T): AsyncResult<T, never> {
  return { ok: true, data };
}

/** Helper to create a failure result */
export function err<E>(error: E): AsyncResult<never, E> {
  return { ok: false, error };
}

/** Loading state for UI */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
