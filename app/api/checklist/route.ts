import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getChecklistItems, createChecklistItem, getCompletionsInRange, toggleCompletion } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const items = await getChecklistItems(userId);

  if (from && to) {
    const completions = await getCompletionsInRange(userId, from, to);
    return NextResponse.json({ items, completions });
  }

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const body = await req.json();

  if (body.action === 'toggle') {
    const done = await toggleCompletion(userId, body.checklistItemId, body.date);
    return NextResponse.json({ done });
  }

  const item = await createChecklistItem(userId, body.text, body.icon);
  return NextResponse.json(item);
}
