'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface ChecklistItem {
  id: string;
  text: string;
  icon: string;
  isDefault?: boolean;
}

interface Completion {
  checklistItemId: string;
  date: string;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekDates(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d.toISOString().slice(0, 10);
  });
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'default-1', text: 'drink water',       icon: '💧', isDefault: true },
  { id: 'default-2', text: 'move your body',     icon: '◌',  isDefault: true },
  { id: 'default-3', text: 'rest without guilt', icon: '○',  isDefault: true },
];

interface Props {
  suggestedItems?: Array<{ text: string; icon: string }>;
}

export default function ChecklistCard({ suggestedItems }: Props) {
  const { data: session } = useSession();

  const baseItems: ChecklistItem[] = suggestedItems && suggestedItems.length > 0
    ? suggestedItems.map((s, i) => ({ id: `suggested-${i}`, text: s.text, icon: s.icon, isDefault: true }))
    : DEFAULT_ITEMS;

  const [items, setItems] = useState<ChecklistItem[]>(baseItems);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [newText, setNewText]         = useState('');
  const suggestionsApplied = useRef(false);

  // When suggestions arrive async, replace only the default items (keep any custom ones)
  useEffect(() => {
    if (!suggestedItems || suggestedItems.length === 0 || suggestionsApplied.current) return;
    suggestionsApplied.current = true;
    setItems(prev => {
      const custom = prev.filter(i => !i.isDefault);
      return [
        ...suggestedItems.map((s, idx) => ({ id: `suggested-${idx}`, text: s.text, icon: s.icon, isDefault: true as const })),
        ...custom,
      ];
    });
  }, [suggestedItems]);

  const weekDates = getWeekDates();
  const today = new Date().toISOString().slice(0, 10);
  const from = weekDates[0], to = weekDates[6];

  useEffect(() => {
    if (!session?.user) return;
    fetch(`/api/checklist?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(({ items: dbItems, completions: dbCompletions }) => {
        if (dbItems?.length) setItems(dbItems.map((i: ChecklistItem) => ({ ...i, isDefault: false })));
        if (dbCompletions)   setCompletions(dbCompletions);
      })
      .catch(() => {});
  }, [session?.user]);

  function isCompleted(itemId: string, date: string) {
    return completions.some(c => c.checklistItemId === itemId && c.date === date);
  }

  async function toggle(item: ChecklistItem) {
    const alreadyDone = isCompleted(item.id, today);

    // Optimistic local update for all users (including guest)
    if (alreadyDone) {
      setCompletions(prev => prev.filter(c => !(c.checklistItemId === item.id && c.date === today)));
    } else {
      setCompletions(prev => [...prev, { checklistItemId: item.id, date: today }]);
    }

    // Persist to API only for authenticated non-default items
    if (!session?.user || item.isDefault) return;

    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', checklistItemId: item.id, date: today }),
      });
      if (!res.ok) {
        // Revert optimistic update on failure
        if (alreadyDone) {
          setCompletions(prev => [...prev, { checklistItemId: item.id, date: today }]);
        } else {
          setCompletions(prev => prev.filter(c => !(c.checklistItemId === item.id && c.date === today)));
        }
      }
    } catch {
      // Revert on network error
      if (alreadyDone) {
        setCompletions(prev => [...prev, { checklistItemId: item.id, date: today }]);
      } else {
        setCompletions(prev => prev.filter(c => !(c.checklistItemId === item.id && c.date === today)));
      }
    }
  }

  async function addItem() {
    if (!newText.trim() || !session?.user) return;
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim() }),
      });
      const item = await res.json();
      setItems(prev => [...prev, { ...item, isDefault: false }]);
      setNewText('');
    } catch {}
  }

  async function removeItem(id: string) {
    if (!session?.user) return;
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await fetch(`/api/checklist/${id}`, { method: 'DELETE' });
    } catch {}
  }

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="cat-label" style={{ marginBottom: '0.75rem' }}>gentle checklist</div>
      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--soft-ink)', marginTop: 0, marginBottom: '1rem' }}>
        these are not goals. they are options.
      </p>

      {items.map(item => {
        const todayDone = isCompleted(item.id, today);
        return (
          <div key={item.id} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <button
                onClick={() => toggle(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <span style={{
                  width: '18px', height: '18px', borderRadius: '2px',
                  border: `1.5px solid ${todayDone ? 'var(--sage)' : 'var(--line)'}`,
                  background: todayDone ? 'var(--sage)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  {todayDone && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
                </span>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--ink)' }}>
                  {item.icon} {item.text}
                </span>
              </button>
              {session?.user && !item.isDefault && (
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--line)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0 0 0.5rem' }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Weekly strip */}
            <div className="day-strip">
              {weekDates.map((d, i) => (
                <div
                  key={d}
                  className={`day-strip-cell${isCompleted(item.id, d) ? ' done' : ''}`}
                  title={d}
                >
                  {DAYS[i]}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add new — only for signed-in users */}
      {session?.user && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <input
            className="ink-input"
            type="text"
            placeholder="add something…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
          />
          <button
            className="btn-secondary"
            onClick={addItem}
            style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', minHeight: '36px', fontSize: '0.8rem' }}
          >
            add
          </button>
        </div>
      )}
    </div>
  );
}
