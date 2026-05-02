import { NextRequest, NextResponse } from 'next/server';

interface WeekData {
  allItems: string[];
  topWords: Array<{ word: string; count: number }>;
  weather: { light: number; heavy: number; neutral: number };
  themes: Record<string, number>;
  daysWritten: number;
  totalNoticings: number;
}

function hasValidApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.startsWith('sk-ant-');
}

function fallbackSummary(data: WeekData): string {
  if (data.daysWritten === 0) return 'Nothing written this week yet.';
  const parts: string[] = [];
  const tone = data.weather.light > data.weather.heavy * 1.5 ? 'lighter'
    : data.weather.heavy > data.weather.light * 1.5 ? 'heavier' : 'mixed';
  if (data.topWords[0]) parts.push(`"${data.topWords[0].word}" came up most in what you wrote.`);
  const topTheme = Object.entries(data.themes).sort(([, a], [, b]) => b - a).find(([, v]) => v > 0);
  if (topTheme) parts.push(`Your noticings touched on ${topTheme[0]} most.`);
  parts.push(tone === 'lighter' ? 'The week leaned light.'
    : tone === 'heavier' ? 'The week carried some weight.'
    : 'Light and heavy both showed up.');
  return parts.join(' ');
}

export async function POST(req: NextRequest) {
  const data: WeekData = await req.json();

  if (!hasValidApiKey()) {
    return NextResponse.json({ summary: fallbackSummary(data) });
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const allItemsList = data.allItems.slice(0, 30).map(i => `- ${i}`).join('\n');

    const prompt = `You are writing a short weekly reflection for someone using a journaling app called "Six Things". They write 6 small things they noticed each day.

Their actual entries from this week:
${allItemsList}

Stats:
- Days written: ${data.daysWritten}, total noticings: ${data.totalNoticings}
- Tone: ${data.weather.light} lighter, ${data.weather.heavy} heavier, ${data.weather.neutral} neutral

Write 2-3 sentences as a weekly portrait using ONLY their actual words and patterns. Rules:
- Second person ("you"), gentle and observational
- Reference specific things they actually wrote — quote words or phrases from the entries
- Never add interpretation, advice, or emotions they didn't express
- No fluff or filler, no positive spin
- Tone: quiet, noticing, like a letter from a thoughtful friend

Return ONLY the summary text, no JSON, no preamble.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return NextResponse.json({ summary: text || fallbackSummary(data) });
  } catch (err) {
    console.error('Weekly summary generation failed:', err);
    return NextResponse.json({ summary: fallbackSummary(data) });
  }
}
