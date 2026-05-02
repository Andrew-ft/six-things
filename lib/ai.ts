import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CRISIS_PATTERNS = [
  /suicid/i, /self.harm/i, /self.hurt/i, /cut myself/i, /kill myself/i,
  /eating disorder/i, /anorexia/i, /bulimia/i, /overdose/i, /substance abuse/i,
];

function containsCrisisContent(text: string): boolean {
  return CRISIS_PATTERNS.some(p => p.test(text));
}

export async function getGentleFollowUp(currentItems: string[]): Promise<string | null> {
  const joined = currentItems.filter(Boolean).join('; ');
  if (!joined) return null;
  if (containsCrisisContent(joined)) return null;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 80,
    system: 'You are a gentle, quiet journaling companion. Your role is to ask ONE short follow-up question that helps the person go deeper — not to interpret, diagnose, or add meaning. The question should be curious and open. Never more than 12 words. Never start with "I". No therapy-speak.',
    messages: [{ role: 'user', content: `The person has written: "${joined}". Ask one gentle follow-up question.` }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null;
  return text;
}

export async function generateLetterFromYourself(items: string[]): Promise<string> {
  if (containsCrisisContent(items.join(' '))) {
    return "Dear you — these words are yours. Keep them close.";
  }

  const phrases = items.filter(Boolean).slice(0, 12).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are weaving a short letter from a person to themselves, using ONLY their exact phrases from this month's journal. Rules:
- Begin with "Dear me,"
- Use ONLY the user's exact phrases — never invent details or feelings
- Add only minimal connecting words: "you noticed", "you're still here", "this month you wrote about", "and then"
- One paragraph, 4-6 sentences maximum
- End with something quiet and true from their own words
- Never add interpretation, advice, or emotion they didn't express
- If content seems to relate to self-harm or crisis, respond with only: "Dear you — these words are yours. Keep them close."`,
    messages: [{ role: 'user', content: `The person's noticings this month:\n${phrases}` }],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : "Dear me — these are the things I noticed.";
}

export async function reframeHabitPhrase(phrase: string): Promise<string | null> {
  if (containsCrisisContent(phrase)) return null;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 80,
    system: 'Gently reframe one self-critical phrase into a neutral or compassionate observation. Keep the same approximate meaning. Do not add advice or positivity spin. Under 15 words. Return only the reframed sentence.',
    messages: [{ role: 'user', content: `Original: "${phrase}"` }],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : null;
}
