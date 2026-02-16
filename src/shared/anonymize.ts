/**
 * On-device text anonymization for privacy-first AI story generation.
 *
 * Detects and replaces PII (emails, phones, URLs, dates, proper nouns)
 * with generic placeholders. Returns a replacement map so the generated
 * story can be re-personalized after AI returns it.
 */

const COMMON_WORDS = new Set([
  'i', 'the', 'a', 'an', 'and', 'or', 'but', 'so', 'yet', 'for', 'nor',
  'my', 'me', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'this', 'that', 'these', 'those', 'is', 'am', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall',
  'to', 'of', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'into',
  'about', 'after', 'before', 'between', 'through', 'during', 'without',
  'not', 'no', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'than', 'too', 'very', 'just', 'also',
  'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how',
  'if', 'because', 'although', 'while', 'since', 'until', 'unless',
  'really', 'actually', 'never', 'always', 'sometimes', 'often',
  'today', 'tomorrow', 'yesterday', 'already', 'still', 'again',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december',
  'new', 'good', 'great', 'first', 'last', 'long', 'little', 'own',
  'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next',
  'early', 'young', 'important', 'public', 'bad', 'same', 'able',
  'much', 'many', 'well', 'back', 'even', 'what', 'which', 'who',
  'going', 'got', 'went', 'made', 'felt', 'think', 'know', 'want',
  'said', 'like', 'thing', 'things', 'way', 'time', 'day', 'days',
  'life', 'world', 'something', 'nothing', 'everything', 'everyone',
  'someone', 'anyone', 'anything',
]);

const PERSON_PLACEHOLDERS = ['someone', 'a friend', 'a colleague', 'a person'];
let personIndex = 0;

function nextPersonPlaceholder(): string {
  const p = PERSON_PLACEHOLDERS[personIndex % PERSON_PLACEHOLDERS.length]!;
  personIndex++;
  return p;
}

export interface AnonymizeResult {
  cleaned: string;
  replacements: Map<string, string>;
}

export function anonymize(text: string): AnonymizeResult {
  const replacements = new Map<string, string>();
  let cleaned = text;
  personIndex = 0;

  // 1. Emails
  cleaned = cleaned.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => {
      const placeholder = '[email]';
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  // 2. URLs
  cleaned = cleaned.replace(
    /https?:\/\/\S+/g,
    (match) => {
      const placeholder = '[link]';
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  // 3. Phone numbers
  cleaned = cleaned.replace(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
    (match) => {
      // Avoid matching plain numbers like years or short sequences
      if (/^\d{4}$/.test(match.trim())) return match;
      const placeholder = '[phone]';
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  // 4. Dates with years (e.g. "March 15, 2024", "Dec 3 2023", "15 March 2024")
  cleaned = cleaned.replace(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    (match) => {
      const placeholder = '[date]';
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  // Also match "15 March 2024" format
  cleaned = cleaned.replace(
    /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}\b/gi,
    (match) => {
      const placeholder = '[date]';
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  // Also match MM/DD/YYYY or DD/MM/YYYY
  cleaned = cleaned.replace(
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g,
    (match) => {
      const placeholder = '[date]';
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  // 5. Proper nouns (capitalized words not at sentence start)
  cleaned = cleaned.replace(
    /(?<=[.!?]\s+\S+\s+|,\s+|;\s+|\band\s+|\bwith\s+|\bto\s+|\bfrom\s+|\bat\s+|\bin\s+)([A-Z][a-z]{2,})/g,
    (match) => {
      if (COMMON_WORDS.has(match.toLowerCase())) return match;
      const placeholder = nextPersonPlaceholder();
      replacements.set(placeholder + '_' + replacements.size, match);
      return placeholder;
    },
  );

  return { cleaned, replacements };
}

export function repersonalize(
  text: string,
  replacements: Map<string, string>,
): string {
  let result = text;
  // Reverse the replacements: put originals back
  for (const [key, original] of replacements) {
    // key is like "[email]_0", placeholder is the part before "_N"
    const placeholder = key.replace(/_\d+$/, '');
    // Replace first occurrence of the placeholder
    result = result.replace(placeholder, original);
  }
  return result;
}
