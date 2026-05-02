import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEntryByDate, upsertEntry, getAllEntries } from '@/lib/db/queries';
import { getTodaysPrompt } from '@/lib/prompts';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (date) {
    const entry = await getEntryByDate(userId, date);
    return NextResponse.json(entry ?? null);
  }

  const entries = await getAllEntries(userId);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const body = await req.json();
  const date = body.date ?? new Date().toISOString().slice(0, 10);
  const prompt = getTodaysPrompt();

  const entry = await upsertEntry({
    userId,
    date,
    promptText: body.promptText ?? prompt.text,
    promptType: body.promptType ?? prompt.type,
    items: (body.items ?? []).filter((s: string) => s.trim()),
  });

  return NextResponse.json(entry);
}
