/**
 * Simple keyword-based sentiment analysis.
 * Returns an inferred mood based on word frequency in the text.
 * Not perfect — just a reasonable heuristic until AI is wired up.
 */

import type { Mood } from '@domain/models/JournalEntry';

const MOOD_WORDS: Record<Mood, string[]> = {
  great: [
    'amazing', 'awesome', 'brilliant', 'celebrate', 'delighted', 'ecstatic',
    'excellent', 'excited', 'fantastic', 'grateful', 'happy', 'incredible',
    'inspired', 'joyful', 'love', 'outstanding', 'perfect', 'proud',
    'thrilled', 'triumph', 'wonderful', 'breakthrough', 'nailed',
  ],
  good: [
    'better', 'calm', 'clear', 'comfortable', 'confident', 'cool',
    'decent', 'enjoy', 'fine', 'glad', 'hopeful', 'nice', 'okay',
    'optimistic', 'pleasant', 'positive', 'productive', 'progress',
    'relaxed', 'relieved', 'satisfied', 'smooth', 'solid', 'steady',
  ],
  neutral: [
    'average', 'balanced', 'busy', 'considering', 'managing', 'meh',
    'mixed', 'moderate', 'normal', 'ordinary', 'processing', 'routine',
    'thinking', 'uncertain', 'undecided', 'usual', 'whatever',
  ],
  bad: [
    'angry', 'annoyed', 'anxious', 'concerned', 'confused', 'difficult',
    'disappointed', 'doubt', 'drained', 'failing', 'frustrat', 'irritat',
    'nervous', 'overwhelm', 'problem', 'regret', 'stress', 'struggle',
    'tired', 'tough', 'trouble', 'uncomfortable', 'unhappy', 'worried',
  ],
  awful: [
    'awful', 'broken', 'burnout', 'crushed', 'depressed', 'despair',
    'desperate', 'devastat', 'dread', 'exhaust', 'hate', 'hopeless',
    'horrible', 'miserable', 'nightmare', 'panic', 'terrible', 'worst',
  ],
};

const MOOD_SCORE: Record<Mood, number> = {
  great: 2,
  good: 1,
  neutral: 0,
  bad: -1,
  awful: -2,
};

export function inferMood(text: string): Mood {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let totalScore = 0;
  let matchCount = 0;

  for (const [mood, keywords] of Object.entries(MOOD_WORDS) as [Mood, string[]][]) {
    for (const keyword of keywords) {
      // Use includes for partial matches (e.g. "frustrat" matches "frustrated", "frustrating")
      const count = words.filter((w) => w.includes(keyword)).length;
      if (count > 0) {
        totalScore += MOOD_SCORE[mood] * count;
        matchCount += count;
      }
    }
  }

  if (matchCount === 0) return 'neutral';

  const avg = totalScore / matchCount;
  if (avg >= 1.2) return 'great';
  if (avg >= 0.4) return 'good';
  if (avg > -0.4) return 'neutral';
  if (avg > -1.2) return 'bad';
  return 'awful';
}
