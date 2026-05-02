import Anthropic from '@anthropic-ai/sdk';

const CRISIS_PATTERNS = [
  /suicid/i, /self.harm/i, /self.hurt/i, /cut myself/i, /kill myself/i,
  /eating disorder/i, /anorexia/i, /bulimia/i, /overdose/i, /substance abuse/i,
];

function containsCrisisContent(text: string): boolean {
  return CRISIS_PATTERNS.some(p => p.test(text));
}

function hasValidApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.startsWith('sk-ant-');
}

function templateLetter(items: string[]): string {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return "Dear me — these are the things I noticed.";
  const first  = clean[0];
  const middle = clean.slice(1, Math.min(4, clean.length));
  const last   = clean[clean.length - 1];
  const middleSentence = middle.length > 0
    ? ` You also wrote about ${middle.join(', and ')}.`
    : '';
  return `Dear me,\n\nThis month you noticed "${first}".${middleSentence} And then, quietly, "${last}". You're still here, writing things down. That counts for something.`;
}

function templateFollowUp(items: string[]): string {
  const templates = [
    'What else did you notice around that?',
    'What made that worth writing down today?',
    'How did that sit with you?',
    'Was that familiar, or something new?',
    'What were you doing when you noticed that?',
  ];
  return templates[Math.floor(items.length % templates.length)];
}

export async function getGentleFollowUp(currentItems: string[]): Promise<string | null> {
  const joined = currentItems.filter(Boolean).join('; ');
  if (!joined) return null;
  if (containsCrisisContent(joined)) return null;

  if (!hasValidApiKey()) return templateFollowUp(currentItems);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      system: 'You are a gentle, quiet journaling companion. Your role is to ask ONE short follow-up question that helps the person go deeper — not to interpret, diagnose, or add meaning. The question should be curious and open. Never more than 12 words. Never start with "I". No therapy-speak.',
      messages: [{ role: 'user', content: `The person has written: "${joined}". Ask one gentle follow-up question.` }],
    });
    return response.content[0].type === 'text' ? response.content[0].text.trim() : null;
  } catch {
    return templateFollowUp(currentItems);
  }
}

export async function generateLetterFromYourself(items: string[]): Promise<string> {
  if (containsCrisisContent(items.join(' '))) {
    return "Dear you — these words are yours. Keep them close.";
  }

  if (!hasValidApiKey()) return templateLetter(items);

  const phrases = items.filter(Boolean).slice(0, 12).join('\n');

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
    return response.content[0].type === 'text' ? response.content[0].text.trim() : templateLetter(items);
  } catch {
    return templateLetter(items);
  }
}

export async function generateDailyPrompt(): Promise<{ text: string; type: string }> {
  const fallback = (await import('./prompts')).getTodaysPrompt();

  if (!hasValidApiKey()) return fallback;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 120,
      system: `You generate daily journaling prompts for an app called "Six Things" where users write down 6 small things they noticed.

Style rules:
- Gentle, poetic, specific — never prescriptive or achievement-focused
- Invites noticing small ordinary things, not deep reflection or goals
- Usually starts with "Six" followed by something concrete and evocative
- Occasionally uses a split format like "Three [x]. Three [y]."
- Never mentions productivity, improvement, or growth

Prompt types and examples:
- standard: "Six things you noticed today", "Six small moments from today"
- sensory: "Three sounds. Three smells.", "Six textures your hands met today"
- emotional: "Six small joys", "Six things that made you feel something — even tiny things"
- shadow: "Six things you almost said but didn't", "Six things you tried to ignore today"
- wildcard: "Six colours from today", "Six things that were warm today"
- gentle: "Six things that were enough today", "Six things you did without thinking"
- time: "Six things from this morning specifically", "Six things from the last hour"

Return ONLY valid JSON: {"text": "...", "type": "standard|sensory|emotional|shadow|wildcard|gentle|time"}`,
      messages: [{ role: 'user', content: 'Generate one unique journaling prompt for today.' }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed = JSON.parse(raw);
    if (parsed.text && parsed.type) return { text: parsed.text, type: parsed.type };
    return fallback;
  } catch {
    return fallback;
  }
}

export async function reframeHabitPhrase(phrase: string): Promise<string | null> {
  if (containsCrisisContent(phrase)) return null;
  if (!hasValidApiKey()) return null;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      system: 'Gently reframe one self-critical phrase into a neutral or compassionate observation. Keep the same approximate meaning. Do not add advice or positivity spin. Under 15 words. Return only the reframed sentence.',
      messages: [{ role: 'user', content: `Original: "${phrase}"` }],
    });
    return response.content[0].type === 'text' ? response.content[0].text.trim() : null;
  } catch {
    return null;
  }
}
