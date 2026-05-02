'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGuestStore } from '@/lib/guest-store';
import PageFooter from '@/components/shared/page-footer';
import { getPromptForDate, PROMPT_ICONS } from '@/lib/prompts';

interface Entry {
  date: string;
  items: string[];
  promptText: string;
  promptType: string;
}

function CalendarGrid({
  year, month, entryDates, selectedDate, onSelect,
}: {
  year: number; month: number; entryDates: Set<string>;
  selectedDate: string | null; onSelect: (d: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = (firstDay + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontFamily: 'Georgia, serif', fontSize: '0.7rem',
            color: 'var(--soft-ink)', letterSpacing: '0.05em', padding: '0.2rem 0',
          }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasEntry = entryDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          return (
            <div
              key={idx}
              className={`cal-day${hasEntry ? ' cal-day-entry' : ''}${isSelected ? ' cal-day-selected' : ''}`}
              onClick={() => hasEntry && onSelect(dateStr)}
              style={{ position: 'relative', cursor: hasEntry ? 'pointer' : 'default' }}
            >
              {day}
              {hasEntry && !isSelected && (
                <span style={{
                  position: 'absolute', bottom: '3px', left: '50%',
                  transform: 'translateX(-50%)', width: '4px', height: '4px',
                  borderRadius: '50%', background: 'var(--accent)', display: 'block',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LookBackPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const guestStore = useGuestStore();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/entries')
        .then(r => r.json())
        .then(data => {
          setAllEntries(data.map((e: Entry & { items: string[] | null }) => ({
            ...e,
            items: e.items ?? [],
          })));
        })
        .finally(() => setLoading(false));
    } else if (guestStore.isGuest) {
      setAllEntries(guestStore.getEntries().map(e => ({
        date: e.date,
        items: e.items,
        promptText: e.promptText,
        promptType: e.promptType,
      })));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session, guestStore.isGuest]);

  const entryDates = new Set(allEntries.map(e => e.date));
  const sortedDates = [...entryDates].sort();
  const selectedEntry = allEntries.find(e => e.date === selectedDate);

  const selectedIdx = selectedDate ? sortedDates.indexOf(selectedDate) : -1;

  const navigate = useCallback((dir: -1 | 1) => {
    const next = sortedDates[selectedIdx + dir];
    if (next) {
      setSelectedDate(next);
      const d = new Date(next + 'T12:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [selectedIdx, sortedDates]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)' }}>looking back…</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} className="btn-ghost">← back</button>
        <h1 className="font-display" style={{
          fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 400, color: 'var(--ink)', margin: 0,
        }}>
          look back
        </h1>
      </div>

      {/* Calendar */}
      <div className="card-plain" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            className="btn-ghost"
            onClick={() => {
              const d = new Date(viewYear, viewMonth - 1);
              setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
            }}
          >‹</button>
          <span className="cat-label">{monthLabel}</span>
          <button
            className="btn-ghost"
            onClick={() => {
              const d = new Date(viewYear, viewMonth + 1);
              setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
            }}
          >›</button>
        </div>
        <CalendarGrid
          year={viewYear} month={viewMonth}
          entryDates={entryDates}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
      </div>

      {/* Entry display */}
      {selectedEntry ? (
        <div>
          <div className="card ink-reveal" style={{ marginBottom: '1rem' }}>
            {/* Polaroid header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div className="cat-label" style={{ marginBottom: '0.25rem' }}>
                  {PROMPT_ICONS[selectedEntry.promptType as keyof typeof PROMPT_ICONS] ?? '◆'} {selectedEntry.promptType}
                </div>
                <p className="font-display" style={{
                  fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--soft-ink)', margin: 0,
                }}>
                  {selectedEntry.promptText}
                </p>
              </div>
              <p style={{
                fontFamily: 'Georgia, serif', fontSize: '0.75rem', color: 'var(--soft-ink)',
                margin: 0, textAlign: 'right', flexShrink: 0, paddingLeft: '0.5rem',
              }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>

            <ol style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {selectedEntry.items.map((item, i) => (
                <li key={i} style={{
                  display: 'flex', gap: '0.75rem', padding: '0.35rem 0',
                  borderBottom: i < selectedEntry.items.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <span className="font-hand" style={{ color: 'var(--line)', minWidth: '1.2rem' }}>{i + 1}</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'var(--ink)' }}>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={() => navigate(-1)}
              disabled={selectedIdx <= 0}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '1.5px solid var(--line)', background: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: selectedIdx > 0 ? 'pointer' : 'not-allowed',
                color: selectedIdx > 0 ? 'var(--ink)' : 'var(--line)',
                fontSize: '1rem',
              }}
            >←</button>

            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)' }}>
              entry {selectedIdx + 1} of {sortedDates.length}
            </span>

            <button
              onClick={() => navigate(1)}
              disabled={selectedIdx >= sortedDates.length - 1}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '1.5px solid var(--line)', background: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: selectedIdx < sortedDates.length - 1 ? 'pointer' : 'not-allowed',
                color: selectedIdx < sortedDates.length - 1 ? 'var(--ink)' : 'var(--line)',
                fontSize: '1rem',
              }}
            >→</button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)', fontSize: '1rem' }}>
            {entryDates.size > 0 ? 'select a day to read.' : 'nothing written yet.'}
          </p>
          {entryDates.size > 0 && (
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)' }}>
              or use ← → arrow keys to navigate entries.
            </p>
          )}
        </div>
      )}

      <PageFooter />
    </div>
  );
}
