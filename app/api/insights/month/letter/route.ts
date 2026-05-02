import { NextRequest, NextResponse } from 'next/server';
import { generateLetterFromYourself } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const letter = await generateLetterFromYourself(body.items ?? []);
    return NextResponse.json({ letter });
  } catch (err) {
    console.error('Letter generation failed:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
