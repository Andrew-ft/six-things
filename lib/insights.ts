export const LIGHT_WORDS = new Set([
  'joy','joyful','happy','happiness','smile','smiling','laugh','laughter','love','loved',
  'warm','warmth','kind','kindness','gentle','peace','peaceful','calm','calm','soft',
  'bright','beautiful','sunshine','sun','light','cosy','cozy','safe','grateful','gratitude',
  'hope','hopeful','friend','family','connect','connected','sweet','lovely','good','great',
  'wonderful','nice','pleasant','fun','delight','delightful','content','comfortable','relief',
  'excited','glad','cheerful','ease','easy','free','freedom','play','playful','energy',
]);

export const HEAVY_WORDS = new Set([
  'tired','exhausted','sad','sadness','alone','lonely','loneliness','hard','difficult',
  'worry','worried','anxious','anxiety','stress','stressed','fear','afraid','angry','anger',
  'hurt','pain','loss','grief','heavy','dark','dull','empty','numb','cold','distance',
  'missed','miss','regret','sorry','guilt','guilty','shame','ashamed','failed','failure',
  'overwhelmed','stuck','lost','confused','frustrated','bored','boring','dread','dreaded',
  'sick','ill','weak','broken','broken','hate','disgust','disgust',
]);

export const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
  'up','about','into','through','during','before','after','above','below','between',
  'i','my','me','we','our','you','your','he','his','she','her','it','its','they','their',
  'what','which','who','that','this','these','those','is','are','was','were','be','been',
  'have','has','had','do','does','did','will','would','could','should','may','might','can',
  'not','no','so','very','just','like','got','get','one','two','three','four','five','six',
  'went','made','said','saw','felt','today','day','time','thing','things','little','small',
]);

export const THEME_GROUPS: Record<string, string[]> = {
  people:   ['mum','mam','mum','dad','sister','brother','friend','partner','boss','colleague','neighbour','child','children','baby','dog','cat','pet'],
  home:     ['home','house','room','bed','kitchen','garden','door','window','street','desk','sofa','floor','ceiling','wall'],
  weather:  ['rain','raining','sunny','sun','wind','cold','hot','warm','cloud','cloudy','snow','fog','grey','sky','outside','fresh'],
  feelings: ['love','happy','sad','tired','worried','calm','angry','scared','grateful','proud','lonely','hopeful','anxious','peaceful'],
  nature:   ['tree','bird','flower','grass','leaf','water','sea','ocean','light','dark','moon','star','air','stone','ground','earth'],
  time:     ['morning','afternoon','evening','night','yesterday','today','tomorrow','week','month','year','late','early','hour','minute'],
};

export interface EntryItem {
  text: string;
  date: string;
}

export function classifyItems(items: string[]): { light: number; heavy: number; neutral: number } {
  let light = 0, heavy = 0, neutral = 0;
  for (const item of items) {
    const words = item.toLowerCase().split(/\W+/).filter(Boolean);
    const hasLight = words.some(w => LIGHT_WORDS.has(w));
    const hasHeavy = words.some(w => HEAVY_WORDS.has(w));
    if (hasLight && !hasHeavy) light++;
    else if (hasHeavy && !hasLight) heavy++;
    else neutral++;
  }
  return { light, heavy, neutral };
}

export function getTopWords(allItems: string[], limit = 20): Array<{ word: string; count: number }> {
  const freq: Record<string, number> = {};
  for (const item of allItems) {
    const words = item.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .filter(([, c]) => c > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

export function getThemeCounts(allItems: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const text = allItems.join(' ').toLowerCase();
  for (const [theme, keywords] of Object.entries(THEME_GROUPS)) {
    counts[theme] = keywords.filter(kw => text.includes(kw)).length;
  }
  return counts;
}

export function computeStreak(entryDates: string[]): { current: number; longest: number } {
  if (!entryDates.length) return { current: 0, longest: 0 };

  const sorted = [...new Set(entryDates)].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  if (sorted[0] === today || sorted[0] === yesterday) {
    let prev = sorted[0];
    for (const d of sorted) {
      const diff = (new Date(prev).getTime() - new Date(d).getTime()) / 86400000;
      if (diff <= 1) { current++; prev = d; }
      else break;
    }
  }

  let longest = 0, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / 86400000;
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }
  longest = Math.max(longest, run, current);

  return { current, longest };
}

export function computeNoticiingShape(allItems: string[]): {
  inward: number; outward: number;
  sensory: number; conceptual: number;
  light: number; heavy: number;
} {
  const text = allItems.join(' ').toLowerCase();
  const inwardWords = ['i','me','my','myself','felt','feeling','thought','thinking','noticed','realised'];
  const outwardWords = ['she','he','they','her','him','them','outside','street','world','people'];
  const sensoryWords = ['saw','heard','smelled','touched','tasted','felt','sound','smell','colour','colour'];
  const conceptualWords = ['think','thought','understand','meaning','remember','idea','wonder','realise','know'];

  const count = (words: string[]) => words.filter(w => text.includes(w)).length;

  const inward = count(inwardWords);
  const outward = count(outwardWords);
  const sensory = count(sensoryWords);
  const conceptual = count(conceptualWords);

  const { light, heavy } = classifyItems(allItems);

  const total = (a: number, b: number) => Math.max(a + b, 1);

  return {
    inward:     Math.round((inward / total(inward, outward)) * 100),
    outward:    Math.round((outward / total(inward, outward)) * 100),
    sensory:    Math.round((sensory / total(sensory, conceptual)) * 100),
    conceptual: Math.round((conceptual / total(sensory, conceptual)) * 100),
    light:      Math.round((light / total(light, heavy)) * 100),
    heavy:      Math.round((heavy / total(light, heavy)) * 100),
  };
}

export function getInnerVoicePhrases(allItems: string[]): Array<{ phrase: string; count: number }> {
  const patterns = [
    /i should(n'?t)? have/gi,
    /i wish(ed)?/gi,
    /if only/gi,
    /i forgot/gi,
    /i miss(ed)?/gi,
    /i need(ed)? to/gi,
    /i can'?t/gi,
    /i didn'?t/gi,
  ];
  const counts: Record<string, number> = {};
  for (const item of allItems) {
    for (const pat of patterns) {
      const matches = item.match(pat);
      if (matches) {
        const key = matches[0].toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([phrase, count]) => ({ phrase, count }));
}
