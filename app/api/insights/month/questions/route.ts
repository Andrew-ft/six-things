import { NextRequest, NextResponse } from 'next/server';

interface MonthAnalysis {
  topWords: Array<{ word: string; count: number }>;
  weather: { light: number; heavy: number; neutral: number };
  shape: { inward: number; outward: number; sensory: number; conceptual: number; light: number; heavy: number };
  earlyWeather: { light: number; heavy: number; neutral: number };
  lateWeather: { light: number; heavy: number; neutral: number };
  daysWritten: number;
  totalNoticings: number;
  allItems: string[];
  innerVoice?: Array<{ phrase: string; count: number }>;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

function hasValidApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.startsWith('sk-ant-');
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fallbackQuestions(data: MonthAnalysis): QuizQuestion[] {
  const qs: QuizQuestion[] = [];
  if (data.topWords.length >= 3) {
    const correct = data.topWords[0].word;
    const opts = shuffled([data.topWords[0].word, data.topWords[1].word, data.topWords[2].word]);
    qs.push({
      question: 'Which word came up most in what you wrote this month?',
      options: opts,
      correctIdx: opts.indexOf(correct),
      explanation: `"${correct}" appeared ${data.topWords[0].count} times — more than anything else.`,
    });
  } else {
    const { light, heavy } = data.weather;
    const correctIdx = light > heavy * 1.5 ? 0 : heavy > light * 1.5 ? 1 : 2;
    qs.push({
      question: 'How would you describe the mood of what you wrote this month?',
      options: ['mostly light', 'mostly heavy', 'a mix of both'],
      correctIdx,
      explanation: correctIdx === 0 ? `Lighter — ${light} vs ${heavy}.` : correctIdx === 1 ? `Heavier — ${heavy} vs ${light}.` : `Mixed — ${light} lighter, ${heavy} heavier.`,
    });
  }
  const { inward, outward } = data.shape;
  const q2correct = inward > 60 ? 0 : outward > 60 ? 1 : 2;
  qs.push({
    question: 'When you notice things, you tend to look:',
    options: ['inward — feelings, thoughts', 'outward — people, the world', 'about the same'],
    correctIdx: q2correct,
    explanation: q2correct === 0 ? `${inward}% inward.` : q2correct === 1 ? `${outward}% outward.` : `Balanced — ${inward}% inward, ${outward}% outward.`,
  });
  const lateDiff = data.lateWeather.light - data.lateWeather.heavy;
  const earlyDiff = data.earlyWeather.light - data.earlyWeather.heavy;
  const q3correct = lateDiff > earlyDiff + 1 ? 0 : earlyDiff > lateDiff + 1 ? 1 : 2;
  qs.push({
    question: 'As the month went on, things felt:',
    options: ['lighter as it progressed', 'heavier as it progressed', 'roughly the same throughout'],
    correctIdx: q3correct,
    explanation: q3correct === 0 ? 'Later noticings were lighter.' : q3correct === 1 ? 'Later noticings were heavier.' : 'Tone stayed consistent.',
  });
  return qs;
}

function fallbackPortrait(data: MonthAnalysis): string {
  const parts: string[] = [];
  parts.push(`This month you wrote ${data.daysWritten} ${data.daysWritten === 1 ? 'time' : 'times'}, noticing ${data.totalNoticings} small things.`);
  if (data.topWords[0]) parts.push(`The word "${data.topWords[0].word}" came up most — ${data.topWords[0].count} times.`);
  if (data.topWords[1] && data.topWords[2]) parts.push(`You also kept returning to "${data.topWords[1].word}" and "${data.topWords[2].word}".`);
  parts.push(data.weather.light > data.weather.heavy * 1.5 ? 'Your noticings leaned toward the lighter.' : data.weather.heavy > data.weather.light * 1.5 ? 'Your noticings carried some weight.' : 'You held both light and heavy things.');
  return parts.join(' ');
}

export async function POST(req: NextRequest) {
  const data: MonthAnalysis = await req.json();

  if (!hasValidApiKey()) {
    return NextResponse.json({ questions: fallbackQuestions(data), portrait: fallbackPortrait(data) });
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const topWordsStr = data.topWords.slice(0, 5).map(w => `"${w.word}" (${w.count}x)`).join(', ');
    const allItemsList = data.allItems.slice(0, 20).map(i => `- ${i}`).join('\n');

    const prompt = `You are helping someone reflect on their journaling this month in an app called "Six Things". Based on their actual entries, create a self-reflection quiz AND a personal portrait.

Their actual journal entries this month:
${allItemsList}

Additional stats:
- Days written: ${data.daysWritten}, total noticings: ${data.totalNoticings}
- Top words: ${topWordsStr || 'none yet'}
- Emotional tone: ${data.weather.light} lighter, ${data.weather.heavy} heavier, ${data.weather.neutral} neutral
- Noticing direction: ${data.shape.inward}% inward, ${data.shape.outward}% outward
- Early month: ${data.earlyWeather.light} light / ${data.earlyWeather.heavy} heavy; Late month: ${data.lateWeather.light} light / ${data.lateWeather.heavy} heavy

Return ONLY this JSON (no other text):
{
  "portrait": "3-4 sentences describing what this person noticed this month, using their actual words and phrases. Gentle, personal, second-person. No advice or interpretation.",
  "questions": [
    {
      "question": "A specific question about their actual entries — ask them to guess something true about what they wrote",
      "options": ["...", "...", "..."],
      "correctIdx": 0,
      "explanation": "Brief explanation citing evidence from their actual entries"
    }
  ]
}

Rules for questions:
- All 3 questions must be directly based on the actual entries listed above
- Reference specific things they actually wrote (words, themes, patterns)
- correctIdx is 0, 1, or 2
- Exactly 3 questions, each with exactly 3 options
- Keep tone gentle and curious, never clinical`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed = JSON.parse(text);

    return NextResponse.json({
      questions: Array.isArray(parsed.questions) && parsed.questions.length === 3
        ? parsed.questions
        : fallbackQuestions(data),
      portrait: parsed.portrait || fallbackPortrait(data),
    });
  } catch (err) {
    console.error('Questions/portrait generation failed:', err);
    return NextResponse.json({ questions: fallbackQuestions(data), portrait: fallbackPortrait(data) });
  }
}
