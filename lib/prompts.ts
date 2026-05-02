export type PromptType = 'standard' | 'sensory' | 'emotional' | 'shadow' | 'wildcard' | 'gentle' | 'time';

export interface Prompt {
  type: PromptType;
  text: string;
}

export const PROMPTS: Prompt[] = [
  { type: 'standard',  text: "Six things you noticed today" },
  { type: 'standard',  text: "Six small moments from today" },
  { type: 'sensory',   text: "Three sounds. Three smells." },
  { type: 'sensory',   text: "Six textures your hands met today" },
  { type: 'sensory',   text: "Six things you heard but didn't listen to" },
  { type: 'emotional', text: "Six things that made you feel something — even tiny things" },
  { type: 'emotional', text: "Six small joys" },
  { type: 'emotional', text: "Six small irritations" },
  { type: 'emotional', text: "Six things you are grateful for, but never say aloud" },
  { type: 'shadow',    text: "Six things you tried to ignore today" },
  { type: 'shadow',    text: "Six things you almost said but didn't" },
  { type: 'shadow',    text: "Six things you kept to yourself" },
  { type: 'wildcard',  text: "Six smells from today" },
  { type: 'wildcard',  text: "Six things that were warm today" },
  { type: 'wildcard',  text: "Six things that touched your skin today" },
  { type: 'wildcard',  text: "Six things that almost happened" },
  { type: 'wildcard',  text: "Six things you saw twice today" },
  { type: 'wildcard',  text: "Six colours from today" },
  { type: 'gentle',    text: "Six things that were enough today" },
  { type: 'gentle',    text: "Six things that surprised you" },
  { type: 'gentle',    text: "Six things you noticed about yourself" },
  { type: 'gentle',    text: "Six things you did without thinking" },
  { type: 'time',      text: "Six things from your week, not just today" },
  { type: 'time',      text: "Six things from this morning specifically" },
  { type: 'time',      text: "Six things from the last hour" },
];

export const PROMPT_ICONS: Record<PromptType, string> = {
  standard:  '◆',
  sensory:   '◌',
  emotional: '◑',
  shadow:    '◐',
  wildcard:  '✦',
  gentle:    '○',
  time:      '◷',
};

export const PROMPT_LABELS: Record<PromptType, string> = {
  standard:  'standard',
  sensory:   'sensory',
  emotional: 'emotional',
  shadow:    'shadow',
  wildcard:  'wildcard',
  gentle:    'gentle',
  time:      'time',
};

export function getTodaysPrompt(): Prompt {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
  return PROMPTS[seed % PROMPTS.length];
}

export function getPromptForDate(dateStr: string): Prompt {
  const seed = dateStr.split('-').reduce((a, b) => a + parseInt(b), 0);
  return PROMPTS[seed % PROMPTS.length];
}
