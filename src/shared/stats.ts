/**
 * Pure stat computation functions for journal entries.
 * No side effects — all functions take entries and return computed values.
 */

import type { JournalEntry } from '@domain/models/JournalEntry';

export interface StreakResult {
  current: number;
  longest: number;
  todayDone: boolean;
}

export interface DayWords {
  day: string; // e.g. "Mon"
  words: number;
  isToday: boolean;
}

export interface TotalStats {
  totalEntries: number;
  totalWords: number;
}

/** Get calendar date string (YYYY-MM-DD) in local timezone */
function toDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compute current and longest writing streaks.
 * A "day" counts if at least one non-deleted entry was created on that calendar date.
 * Current streak: consecutive days ending today (or yesterday if no entry today yet).
 */
export function computeStreak(entries: JournalEntry[]): StreakResult {
  const active = entries.filter((e) => !e.isDeleted);
  if (active.length === 0) return { current: 0, longest: 0, todayDone: false };

  // Collect unique dates that have entries
  const dateSet = new Set<string>();
  for (const e of active) {
    dateSet.add(toDateKey(e.createdAt));
  }

  const todayKey = toDateKey(new Date().toISOString());
  const todayDone = dateSet.has(todayKey);

  // Sort dates ascending
  const sortedDates = [...dateSet].sort();

  // Compute longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]!);
    const curr = new Date(sortedDates[i]!);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Compute current streak (walk backwards from today or yesterday)
  let current = 0;
  const startDate = new Date();
  if (!todayDone) {
    // Check from yesterday
    startDate.setDate(startDate.getDate() - 1);
  }
  const checkKey = toDateKey(startDate.toISOString());
  if (!dateSet.has(checkKey)) {
    // No entry today or yesterday — streak is 0
    return { current: 0, longest, todayDone };
  }

  // Walk backwards
  const cursor = new Date(startDate);
  while (dateSet.has(toDateKey(cursor.toISOString()))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { current, longest, todayDone };
}

/**
 * Compute word counts for the last 7 days.
 */
export function computeWeeklyWords(entries: JournalEntry[]): DayWords[] {
  const active = entries.filter((e) => !e.isDeleted);
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const result: DayWords[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    const dayLabel = dayNames[d.getDay()]!;

    let words = 0;
    for (const e of active) {
      if (toDateKey(e.createdAt) === key) {
        words += e.wordCount;
      }
    }

    result.push({ day: dayLabel, words, isToday: i === 0 });
  }

  return result;
}

/**
 * Compute total entries and total words across all non-deleted entries.
 */
export function computeTotalStats(entries: JournalEntry[]): TotalStats {
  const active = entries.filter((e) => !e.isDeleted);
  let totalWords = 0;
  for (const e of active) {
    totalWords += e.wordCount;
  }
  return { totalEntries: active.length, totalWords };
}
