'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGuestStore } from '@/lib/guest-store';
import { classifyItems, getTopWords, getThemeCounts } from '@/lib/insights';
import PageFooter from '@/components/shared/page-footer';
import TwoWeathersCard from '@/components/week/two-weathers-card';
import ThemeBarsCard from '@/components/week/theme-bars-card';
import TopWordsCard from '@/components/week/top-words-card';
import ChecklistCard from '@/components/week/checklist-card';

interface WeekData {
  entries: Array<{ date: string; items: string[]; promptText: string }>;
  allItems: string[];
  weather: { light: number; heavy: number; neutral: number };
  topWords: Array<{ word: string; count: number }>;
  themes: Record<string, number>;
  daysWritten: number;
  totalNoticings: number;
}

export default function WeekPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const guestStore = useGuestStore();
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/insights/week')
        .then(r => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    } else if (guestStore.isGuest) {
      const today = new Date();
      const from  = new Date(today); from.setDate(today.getDate() - 6);
      const fromStr = from.toISOString().slice(0, 10);

      const entries = guestStore.getEntries()
        .filter(e => e.date >= fromStr)
        .map(e => ({ date: e.date, items: e.items, promptText: e.promptText }));

      const allItems = entries.flatMap(e => e.items);
      setData({
        entries,
        allItems,
        weather:  classifyItems(allItems),
        topWords: getTopWords(allItems),
        themes:   getThemeCounts(allItems),
        daysWritten: entries.length,
        totalNoticings: allItems.length,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session, guestStore.isGuest]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)' }}>gathering your week…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} className="btn-ghost">← back</button>
        <h1 className="font-display" style={{
          fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 400,
          color: 'var(--ink)', margin: 0,
        }}>
          your week, quietly
        </h1>
      </div>

      {/* Hero */}
      <div className="card ink-reveal" style={{ marginBottom: '1.25rem' }}>
        <p className="font-display" style={{
          fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--ink)',
          margin: 0, lineHeight: 1.5,
        }}>
          You wrote on <strong>{data?.daysWritten ?? 0} {(data?.daysWritten ?? 0) === 1 ? 'day' : 'days'}</strong>,
          noticed <strong>{data?.totalNoticings ?? 0} small things</strong>.
        </p>
      </div>

      {data && data.allItems.length > 0 ? (
        <>
          <TwoWeathersCard weather={data.weather} allItems={data.allItems} />
          <ChecklistCard />
          <ThemeBarsCard themes={data.themes} />
          <TopWordsCard words={data.topWords} />
        </>
      ) : (
        <div className="card-plain" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)', fontSize: '1.1rem' }}>
            nothing written this week yet.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: 'var(--soft-ink)' }}>
            start with today's prompt.
          </p>
        </div>
      )}

      <PageFooter />
    </div>
  );
}
