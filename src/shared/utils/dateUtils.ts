/**
 * Date formatting utilities.
 *
 * All dates in the domain layer are ISO 8601 strings.
 * These helpers format them for display in the UI.
 */

/** Format an ISO string to a human-readable date: "Feb 7, 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO string to date + time: "Feb 7, 2026, 4:50 PM" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format an ISO string to a relative time: "2 hours ago", "just now" */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(iso);
}

/** Get the current time as an ISO 8601 string. */
export function nowISO(): string {
  return new Date().toISOString();
}
