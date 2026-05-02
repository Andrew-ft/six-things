import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface MonthAnalysis {
  topWords: Array<{ word: string; count: number }>;
  weather: { light: number; heavy: number; neutral: number };
  shape: { inward: number; outward: number; sensory: number; conceptual: number; light: number; heavy: number };
  earlyWeather: { light: number; heavy: number; neutral: number };
  lateWeather: { light: number; heavy: number; neutral: number };
  daysWritten: number;
  totalNoticings: number;
  allItems: string[];
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
      explanation: correctIdx === 0 ? `Your words leaned lighter — ${light} vs ${heavy}.`
        : correctIdx === 1 ? `Your words leaned heavier — ${heavy} vs ${light}.`
        : `Light and heavy in balance — ${light} lighter, ${heavy} heavier.`,
    });
  }

  const { inward, outward } = data.shape;
  const q2correct = inward > 60 ? 0 : outward > 60 ? 1 : 2;
  qs.push({
    question: 'When you notice things, you tend to look:',
    options: ['inward — feelings, thoughts', 'outward — people, the world', 'about the same'],
    correctIdx: q2correct,
    explanation: q2correct === 0 ? `${inward}% of your language pointed inward this month.`
      : q2correct === 1 ? `${outward}% of your language pointed outward this month.`
      : `Balanced — ${inward}% inward, ${outward}% outward.`,
  });

  const lateDiff = data.lateWeather.light - data.lateWeather.heavy;
  const earlyDiff = data.earlyWeather.light - data.earlyWeather.heavy;
  const q3correct = lateDiff > earlyDiff + 1 ? 0 : earlyDiff > lateDiff + 1 ? 1 : 2;
  qs.push({
    question: 'As the month went on, things felt:',
    options: ['lighter as it progressed', 'heavier as it progressed', 'roughly the same throughout'],
    correctIdx: q3correct,
    explanation: q3correct === 0 ? 'Your later noticings had a lighter quality than your earlier ones.'
      : q3correct === 1 ? 'Your earlier noticings were lighter; later ones carried more weight.'
      : 'The emotional tone stayed fairly consistent through the month.',
  });

  return qs;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data: MonthAnalysis = await req.json();

  if (!hasValidApiKey()) {
    return NextResponse.json({ questions: fallbackQuestions(data) });
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const topWordsStr = data.topWords.slice(0, 5).map(w => `"${w.word}" (${w.count}x)`).join(', ');
    const sampleItems = data.allItems.slice(0, 10).map(i => `- ${i}`).join('\n');

    const prompt = `You are creating a gentle self-reflection quiz for someone who journals daily. Based on their actual writing patterns this month, create exactly 3 multiple-choice questions.

Their writing data this month:
- Days written: ${data.daysWritten}, total things noticed: ${data.totalNoticings}
- Most frequent words: ${topWordsStr || 'none yet'}
- Emotional tone: ${data.weather.light} lighter noticings, ${data.weather.heavy} heavier, ${data.weather.neutral} neutral
- Noticing direction: ${data.shape.inward}% inward (feelings/thoughts), ${data.shape.outward}% outward (world/people)
- Early month tone: ${data.earlyWeather.light} light / ${data.earlyWeather.heavy} heavy
- Late month tone: ${data.lateWeather.light} light / ${data.lateWeather.heavy} heavy
- Sample entries:
${sampleItems}

Create 3 varied questions that ask the person to guess something true about their own writing patterns. Make each question feel personal and specific to their actual entries. Keep the tone gentle and curious.

Return ONLY valid JSON — no other text before or after:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "..."],
      "correctIdx": 0,
      "explanation": "..."
    }
  ]
}

Rules:
- correctIdx is 0, 1, or 2 (the index of the correct option in the options array)
- Each explanation cites specific evidence from their data
- Options must be meaningfully different from each other
- Exactly 3 questions, each with exactly 3 options`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed.questions) && parsed.questions.length === 3) {
      return NextResponse.json({ questions: parsed.questions });
    }
    return NextResponse.json({ questions: fallbackQuestions(data) });
  } catch (err) {
    console.error('Question generation failed:', err);
    return NextResponse.json({ questions: fallbackQuestions(data) });
  }
}
