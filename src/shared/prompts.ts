/**
 * Prompt Packs — themed journaling prompt collections.
 */

export interface PromptPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompts: string[];
}

const ACTIVE_PACK_KEY = 'journly-active-pack';

export const BUILT_IN_PACKS: PromptPack[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    description: 'Gentle prompts for everyday journaling',
    icon: '🌅',
    prompts: [
      'What small thing brought you joy today?',
      'What are you grateful for right now?',
      'What has been on your mind lately?',
      'What would you tell your future self about today?',
      'What made you smile recently?',
      'What challenge are you working through?',
      'What does your ideal tomorrow look like?',
      'What did you learn about yourself this week?',
      'What moment from today do you want to remember?',
      'What is something you are proud of?',
      'What would make today feel complete?',
      'Who made a difference in your day?',
      'What are you looking forward to?',
      'What feeling keeps coming back to you?',
      'What does rest look like for you right now?',
      'What is one thing you would change about today?',
      'What are you holding onto that you could let go of?',
      'What is something kind you did for yourself?',
      'What sounds, smells, or sights stood out today?',
      'What conversation stuck with you?',
      'What is weighing on your heart?',
      'What simple pleasure did you enjoy today?',
      'What would you do if you had no obligations tomorrow?',
      'What boundary do you need to set?',
      'What are you curious about right now?',
      'What does comfort feel like to you today?',
      'What memory keeps surfacing?',
      'What are you ready to begin?',
      'What truth have you been avoiding?',
      'How are you really feeling right now?',
    ],
  },
  {
    id: 'vacation',
    name: 'Vacation & Travel',
    description: 'Capture moments from your adventures',
    icon: '✈️',
    prompts: [
      'What new thing did you try today?',
      'Describe a moment that surprised you.',
      'What was the most beautiful thing you saw?',
      'What did you eat that you want to remember?',
      'Who did you meet or talk to today?',
      'What sounds defined this place?',
      'What would you tell someone visiting here?',
      'What felt different from your daily routine?',
      'What moment made you laugh today?',
      'How did being somewhere new change your perspective?',
      'What do you want to bring home with you — not a souvenir, but a feeling?',
      'What was harder than expected? What was easier?',
      'Describe the light at a specific moment today.',
      'What smell will remind you of this trip?',
      'What would you do again tomorrow?',
    ],
  },
  {
    id: 'exam-prep',
    name: 'Exam Prep & Focus',
    description: 'A quiet space for what you\'re learning',
    icon: '📚',
    prompts: [
      'What concept clicked for you today?',
      "What's still confusing or unclear?",
      'What study method worked best today?',
      'What would you teach someone about what you learned?',
      'Where did your focus break down, and why?',
      'What are you most confident about right now?',
      'What topic needs more time this week?',
      'How did you take care of yourself while studying?',
      'What question do you think will show up on the exam?',
      'What connection did you make between two ideas?',
      'What distracted you today, and how can you handle it tomorrow?',
      'Write a one-sentence summary of the most important thing you reviewed.',
      'What would make tomorrow a clear study day?',
      'What did you learn from a mistake or wrong answer?',
      'Rate your energy level — what affected it?',
    ],
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    description: 'Notice and appreciate the good things',
    icon: '🙏',
    prompts: [
      'Name 3 things you are thankful for today.',
      'Who helped you recently, and how?',
      'What is a simple comfort you often take for granted?',
      "What's something your body did for you today that you appreciate?",
      'What skill or ability are you grateful to have?',
      'What made today better than it could have been?',
      'Who in your life makes you feel seen?',
      'What past challenge are you grateful you went through?',
      'What about your home are you thankful for?',
      'What small moment of beauty did you notice today?',
      'What piece of technology made your day easier?',
      "What's a memory you're glad you have?",
      'What opportunity do you have that others might not?',
      'What meal or drink did you really enjoy today?',
      'What part of your routine brings you quiet joy?',
    ],
  },
  {
    id: 'self-discovery',
    name: 'Self-Discovery',
    description: 'Explore who you are and who you want to be',
    icon: '🔮',
    prompts: [
      'What value matters most to you right now?',
      'When do you feel most alive?',
      'What would you do if no one was watching?',
      'What pattern in your life do you want to change?',
      'What are you afraid of, and why?',
      'When do you feel most like yourself?',
      'What does success look like to you — not to others?',
      'What belief have you outgrown?',
      'What kind of friend are you?',
      'What do you need more of in your life?',
      'What have you been saying yes to that you should say no to?',
      "What would your 10-year-old self think of you now?",
      'What dream have you put on hold?',
      'What relationship shaped who you are today?',
      'If you could change one habit starting tomorrow, what would it be?',
    ],
  },
  {
    id: 'volunteering',
    name: 'Volunteering & Service',
    description: 'Reflect on giving back and community',
    icon: '🤝',
    prompts: [
      'What impact did you have today?',
      'What did you learn from someone you helped?',
      'What moment made the work feel worthwhile?',
      'What was harder than you expected?',
      'How did helping others change how you see your own life?',
      'What story did someone share with you?',
      'What skill did you use or develop while volunteering?',
      'What surprised you about the people you worked with?',
      'How did today make you feel about your community?',
      'What would you tell someone thinking about volunteering?',
      "What need did you see that isn't being met?",
      'What did you give today, and what did you receive?',
      'How can you carry this experience into your everyday life?',
      "What emotion came up that you didn't expect?",
      'What will you do differently next time?',
    ],
  },
];

/** Returns the active prompt pack based on localStorage. */
export function getActivePack(): PromptPack {
  const id = localStorage.getItem(ACTIVE_PACK_KEY);
  return BUILT_IN_PACKS.find((p) => p.id === id) ?? BUILT_IN_PACKS[0]!;
}

/** Sets the active prompt pack ID in localStorage. */
export function setActivePack(id: string): void {
  localStorage.setItem(ACTIVE_PACK_KEY, id);
}

/** Returns a prompt deterministically based on the day of the year. */
export function getDailyPrompt(): string {
  const pack = getActivePack();
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return pack.prompts[dayOfYear % pack.prompts.length]!;
}

/** Returns a random prompt (different from the daily one). */
export function getRandomPrompt(): string {
  const pack = getActivePack();
  const daily = getDailyPrompt();
  let prompt: string;
  do {
    prompt = pack.prompts[Math.floor(Math.random() * pack.prompts.length)]!;
  } while (prompt === daily && pack.prompts.length > 1);
  return prompt;
}

/** Returns a random prompt from any pack (not just the active one). */
export function getRandomPromptAcrossAll(): string {
  const pack = BUILT_IN_PACKS[Math.floor(Math.random() * BUILT_IN_PACKS.length)]!;
  return pack.prompts[Math.floor(Math.random() * pack.prompts.length)]!;
}
