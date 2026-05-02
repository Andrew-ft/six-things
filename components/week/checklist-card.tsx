'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ChecklistItem {
  id: string;
  text: string;
  icon: string;
}

interface Completion {
  checklistItemId: string;
  date: string;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekDates(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // Mon=0
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return d.toISOString().slice(0, 10);
  });
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 'default-1', text: 'drink water', icon: '💧' },
  { id: 'default-2', text: 'move your body', icon: '◌' },
  { id: 'default-3', text: 'rest without guilt', icon: '○' },
];

export default function ChecklistCard() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);

  const weekDates = getWeekDates();
  const today = new Date().toISOString().slice(0, 10);
  const from = weekDates[0], to = weekDates[6];

  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    fetch(`/api/checklist?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(({ items: dbItems, completions: dbCompletions }) => {
        if (dbItems?.length) setItems(dbItems);
        if (dbCompletions)   setCompletions(dbCompletions);
      })
      .finally(() => setLoading(false));
  }, [session]);

  function isCompleted(itemId: string, date: string) {
    return completions.some(c => c.checklistItemId === itemId && c.date === date);
  }

  async function toggle(itemId: string) {
    if (!session?.user) return;
    const res = await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', checklistItemId: itemId, date: today }),
    });
    const { done } = await res.json();
    if (done) {
      setCompletions(prev => [...prev, { checklistItemId: itemId, date: today }]);
    } else {
      setCompletions(prev => prev.filter(c => !(c.checklistItemId === itemId && c.date === today)));
    }
  }

  async function addItem() {
    if (!newText.trim() || !session?.user) return;
    const res = await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText.trim() }),
    });
    const item = await res.json();
    setItems(prev => [...prev, item]);
    setNewText('');
  }

  async function removeItem(id: string) {
    if (!session?.user) return;
    await fetch(`/api/checklist/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
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
                onClick={() => toggle(item.id)}
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
              {session?.user && !item.id.startsWith('default') && (
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

      {/* Add new */}
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
