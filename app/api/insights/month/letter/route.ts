import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateLetterFromYourself } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const letter = await generateLetterFromYourself(body.items ?? []);
    return NextResponse.json({ letter });
  } catch (err) {
    console.error('Letter generation failed:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
