import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEntriesInRange } from '@/lib/db/queries';
import { classifyItems, getTopWords, computeNoticiingShape, getInnerVoicePhrases } from '@/lib/insights';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fromStr = firstOfMonth.toISOString().slice(0, 10);
  const toStr   = today.toISOString().slice(0, 10);

  const entries = await getEntriesInRange(userId, fromStr, toStr);
  const allItems = entries.flatMap(e => e.items ?? []);

  const midpoint = Math.floor(entries.length / 2);
  const earlyItems = entries.slice(midpoint).flatMap(e => e.items ?? []);
  const lateItems  = entries.slice(0, midpoint).flatMap(e => e.items ?? []);

  const earlyWeather = classifyItems(earlyItems);
  const lateWeather  = classifyItems(lateItems);

  const shape = computeNoticiingShape(allItems);
  const topWords = getTopWords(allItems, 30);
  const innerVoice = getInnerVoicePhrases(allItems);
  const weather = classifyItems(allItems);

  return NextResponse.json({
    entries,
    allItems,
    topWords,
    shape,
    innerVoice,
    weather,
    earlyWeather,
    lateWeather,
    daysWritten: entries.length,
    totalNoticings: allItems.length,
    fromStr,
    toStr,
  });
}
