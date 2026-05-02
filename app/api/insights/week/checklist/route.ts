import { NextRequest, NextResponse } from 'next/server';

interface SuggestedItem {
  text: string;
  icon: string;
}

function hasValidApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key.startsWith('sk-ant-');
}

const FALLBACK_ICONS = ['◌', '○', '◎'];

function fallbackItems(): SuggestedItem[] {
  return [
    { text: 'drink water', icon: '💧' },
    { text: 'move your body', icon: '◌' },
    { text: 'rest without guilt', icon: '○' },
  ];
}

export async function POST(req: NextRequest) {
  const { allItems }: { allItems: string[] } = await req.json();

  if (!allItems || allItems.length === 0) {
    return NextResponse.json({ items: fallbackItems() });
  }

  if (!hasValidApiKey()) {
    return NextResponse.json({ items: fallbackItems() });
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const entriesList = allItems.slice(0, 20).map(i => `- ${i}`).join('\n');

    const prompt = `Someone has been journaling small things they notice. Based on their actual entries, suggest 3 very gentle, small actions they might want to try this week — things that feel connected to what they've been noticing or experiencing.

Their entries:
${entriesList}

Rules:
- Each item should feel like a quiet invitation, not a task or goal
- Connect to what they actually wrote — if they noticed tiredness, suggest rest; if they noticed food, suggest eating something they enjoy; if they noticed nature, suggest going outside
- Keep text short (3-6 words), lowercase
- Pick a single simple icon (emoji or minimal symbol) for each
- Never use the words "should", "must", "need to", or "try to"
- Never suggest therapy, journaling, or reflection

Return ONLY this JSON (no other text):
[
  { "text": "...", "icon": "..." },
  { "text": "...", "icon": "..." },
  { "text": "...", "icon": "..." }
]`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed: SuggestedItem[] = JSON.parse(text);

    if (Array.isArray(parsed) && parsed.length === 3 && parsed.every(i => i.text && i.icon)) {
      return NextResponse.json({ items: parsed });
    }
    return NextResponse.json({ items: fallbackItems() });
  } catch (err) {
    console.error('Checklist suggestion failed:', err);
    return NextResponse.json({ items: fallbackItems() });
  }
}
