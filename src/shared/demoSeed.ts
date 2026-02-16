/**
 * Demo seed data — call `seedDemo()` in the browser console (dev mode).
 *
 * Usage:
 *   1. `npm run dev` and open the app
 *   2. Open browser console (F12)
 *   3. Type: seedDemo()
 *
 * Seeds 12 journal entries + 2 stories.
 */

import { useEntryStore } from '@application/store/useEntryStore';
import { useStoryStore } from '@application/store/useStoryStore';
import type { JournalEntry } from '@domain/models/JournalEntry';
import { countWords } from '@domain/models/JournalEntry';
import type { Story } from '@domain/models/Story';
import { generateId } from '@shared/utils/idGenerator';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  return d.toISOString();
}

const DEMO_ENTRIES: { content: string; mood?: JournalEntry['mood']; daysAgo: number }[] = [
  {
    content:
      "Woke up before my alarm today. Made coffee slowly, watched the light change on the wall. I don't know why, but mornings like this make everything feel more possible. Signed up for that ceramics class I've been eyeing — starts next week.",
    mood: 'great',
    daysAgo: 0,
  },
  {
    content:
      'Had a tough conversation with Mom on the phone. She means well but sometimes the advice feels like pressure. I need to figure out how to set boundaries without making her feel shut out. Journaling about it helps me untangle the emotions.',
    mood: 'bad',
    daysAgo: 1,
  },
  {
    content:
      "Tried a new recipe — roasted cauliflower tacos with pickled onions. Surprisingly good. Cooking is becoming my favorite way to decompress after work. There's something meditative about chopping vegetables.",
    mood: 'good',
    daysAgo: 2,
  },
  {
    content:
      'Long walk through the park after work. The cherry blossoms are starting to bloom and the whole path smelled incredible. Sat on a bench for twenty minutes doing nothing. I should do this more often.',
    mood: 'great',
    daysAgo: 3,
  },
  {
    content:
      "Presentation at work went okay, not great. I stumbled on the Q&A section and felt embarrassed. But my manager said the content was solid and that's what matters. Working on not being so hard on myself.",
    mood: 'neutral',
    daysAgo: 4,
  },
  {
    content:
      "Finished reading 'Klara and the Sun' — it left me thinking about loneliness and what it means to truly observe someone. Beautiful and unsettling. Started 'Piranesi' next; loving it so far.",
    mood: 'good',
    daysAgo: 5,
  },
  {
    content:
      'Rainy day. Stayed in and reorganized my desk. Found old photos from college and sat on the floor looking at them for an hour. Strange how some memories feel like they belong to a different person.',
    mood: 'neutral',
    daysAgo: 6,
  },
  {
    content:
      "Ran 5K this morning without stopping — first time in months. My lungs burned but I felt alive. Training for the half marathon is starting to feel real. Body is sore but I'm proud.",
    mood: 'great',
    daysAgo: 7,
  },
  {
    content:
      "Couldn't sleep last night. Mind was racing about the move next month. Made a list of everything I need to do and it actually calmed me down. Lists are my therapy.",
    mood: 'bad',
    daysAgo: 9,
  },
  {
    content:
      'Coffee with Sam. We talked for three hours and it felt like twenty minutes. Good friendships are the ones where you can pick up right where you left off. Grateful for people like that.',
    mood: 'great',
    daysAgo: 10,
  },
  {
    content:
      'Volunteered at the food bank this morning. Packed over 200 boxes. The other volunteers were so warm and funny. Reminded me that getting out of my own head is sometimes the best medicine.',
    mood: 'good',
    daysAgo: 12,
  },
  {
    content:
      "Quiet Sunday. Watched the clouds from the balcony and drank too much tea. Didn't accomplish anything and that felt okay for once. Rest is productive too — I keep needing to remind myself of that.",
    mood: 'good',
    daysAgo: 14,
  },
];

function buildDemoEntries(): JournalEntry[] {
  return DEMO_ENTRIES.map((e) => {
    const ts = daysAgo(e.daysAgo);
    return {
      id: generateId(),
      createdAt: ts,
      updatedAt: ts,
      title: '',
      content: e.content,
      mood: e.mood,
      tags: [],
      wordCount: countWords(e.content),
      isDeleted: false,
    };
  });
}

function buildDemoStories(entryIds: string[]): Story[] {
  return [
    {
      id: generateId(),
      createdAt: daysAgo(2),
      title: 'Finding stillness in motion',
      content:
        `There's a rhythm I've been chasing without knowing it — something between restlessness and peace.\n\nIt started with the mornings. Waking before the alarm, watching light stretch across the wall like it had nowhere else to be. Coffee in hand, no rush. Those moments felt like permission to just exist.\n\nThen the walks. Cherry blossoms lining the path, their scent almost too sweet, too fleeting. I sat on a park bench for twenty minutes doing absolutely nothing, and it was the most productive thing I'd done all week.\n\nEven the run — lungs burning, legs protesting — had its own kind of quiet. Not silence, but focus. The world narrowed to breath and pavement, and for those thirty minutes, nothing else mattered.\n\nI'm learning that stillness isn't about stopping. It's about moving with intention. The ceramics class starts next week. I think my hands need something slow to do.`,
      sourceEntryIds: [entryIds[0]!, entryIds[3]!, entryIds[7]!],
      prompt: 'Finding stillness in motion',
      provider: 'local',
    },
    {
      id: generateId(),
      createdAt: daysAgo(8),
      title: 'The people who stay',
      content:
        `Some people fit into your life like they were always supposed to be there.\n\nSam and I hadn't talked in weeks, maybe longer. But three hours at that corner café felt like twenty minutes. We picked up mid-sentence, mid-thought, mid-laugh. No awkward warming up, no small talk buffer. Just the good stuff, right away.\n\nI think about the volunteers at the food bank the same way. Strangers, technically. But packing those boxes side by side, cracking jokes over assembly lines — there was a warmth that didn't need context or history. It just was.\n\nMom is different. Her love arrives wrapped in advice I didn't ask for, opinions that feel like pressure. But she calls. She always calls. And underneath the noise, there's someone who just doesn't want to miss anything.\n\nI'm learning to hold space for all of it — the easy friendships, the complicated ones, the ones that surprise you at a food bank on a Tuesday morning. The people who stay aren't always the ones who make it easy. Sometimes they're the ones who make it real.`,
      sourceEntryIds: [entryIds[1]!, entryIds[9]!, entryIds[10]!],
      prompt: 'The people who stay',
      provider: 'local',
    },
  ];
}

/** Call this to populate the stores with demo data (entries + stories). */
export function seedDemo(): void {
  const entries = buildDemoEntries();
  useEntryStore.getState().setEntries(entries);

  const entryIds = entries.map((e) => e.id);
  const stories = buildDemoStories(entryIds);
  useStoryStore.getState().setStories(stories);

  // Mark first-run as complete and pack as discovered so we see the main UI
  localStorage.setItem('journly-first-run-complete', '1');
  localStorage.setItem('journly-pack-discovered', '1');
  console.log(`Seeded ${entries.length} demo entries and ${stories.length} stories.`);
}
