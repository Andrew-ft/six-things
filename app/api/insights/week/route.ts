import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEntriesInRange } from '@/lib/db/queries';
import { classifyItems, getTopWords, getThemeCounts } from '@/lib/insights';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const today = new Date();
  const from = new Date(today); from.setDate(today.getDate() - 6);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr   = today.toISOString().slice(0, 10);

  const entries = await getEntriesInRange(userId, fromStr, toStr);
  const allItems = entries.flatMap(e => e.items ?? []);

  const weather = classifyItems(allItems);
  const topWords = getTopWords(allItems);
  const themes = getThemeCounts(allItems);

  const daysWritten = entries.length;
  const totalNoticings = allItems.length;

  return NextResponse.json({
    entries,
    allItems,
    weather,
    topWords,
    themes,
    daysWritten,
    totalNoticings,
    fromStr,
    toStr,
  });
}
