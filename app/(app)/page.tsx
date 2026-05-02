import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Prompt, PromptType } from '@/lib/prompts';
import { getEntryByDate, getAllEntries } from '@/lib/db/queries';
import { computeStreak } from '@/lib/insights';
import { generateDailyPrompt } from '@/lib/ai';
import HomeClient from './home-client';

export default async function HomePage() {
  const session = await auth();

  const today = new Date().toISOString().slice(0, 10);
  let prompt: Prompt = await generateDailyPrompt() as Prompt;

  let hasTodayEntry = false;
  let streakData = { current: 0, longest: 0 };
  let totalDays = 0;
  let totalNoticings = 0;
  let throwback: { item: string; date: string } | null = null;

  if (session?.user) {
    const userId = (session.user as typeof session.user & { id: string }).id;
    const [todayEntry, allEntries] = await Promise.all([
      getEntryByDate(userId, today),
      getAllEntries(userId),
    ]);

    // If already submitted today, lock the prompt to the saved one
    if (todayEntry?.promptText && todayEntry?.promptType) {
      prompt = { text: todayEntry.promptText, type: todayEntry.promptType as PromptType };
    }

    hasTodayEntry = !!todayEntry;
    streakData = computeStreak(allEntries.map(e => e.date));
    totalDays = allEntries.length;
    totalNoticings = allEntries.reduce((acc, e) => acc + (e.items?.length ?? 0), 0);

    // Random throwback from past entries (not today)
    const past = allEntries.filter(e => e.date !== today && (e.items?.length ?? 0) > 0);
    if (past.length > 0 && Math.random() < 0.4) {
      const entry = past[Math.floor(Math.random() * past.length)];
      const items = entry.items ?? [];
      throwback = {
        item: items[Math.floor(Math.random() * items.length)],
        date: entry.date,
      };
    }
  }

  return (
    <HomeClient
      prompt={prompt}
      hasTodayEntry={hasTodayEntry}
      streak={streakData}
      totalDays={totalDays}
      totalNoticings={totalNoticings}
      throwback={throwback}
      isGuest={!session?.user}
      userName={session?.user?.name ?? null}
      userEmail={session?.user?.email ?? null}
    />
  );
}
