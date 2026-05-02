'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getTodaysPrompt, PROMPT_ICONS, PROMPT_LABELS } from '@/lib/prompts';
import { useGuestStore } from '@/lib/guest-store';
import PageFooter from '@/components/shared/page-footer';

const PLACEHOLDERS = [
  'the first thing...',
  'something small...',
  'a moment...',
  'a detail...',
  'one more...',
  'and one last...',
];

export default function WritePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const guestStore = useGuestStore();

  const [prompt] = useState(() => getTodaysPrompt());
  const [items, setItems] = useState(['', '', '', '', '', '']);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  function handleChange(i: number, val: string) {
    const next = [...items];
    next[i] = val;
    setItems(next);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Enter' && i < 5) {
      e.preventDefault();
      inputRefs.current[i + 1]?.focus();
    }
  }

  async function handleSave() {
    const filled = items.filter(s => s.trim());
    if (!filled.length) return;

    setSaving(true);

    if (session?.user) {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:       today,
          promptText: prompt.text,
          promptType: prompt.type,
          items:      filled,
        }),
      });
    } else {
      // Guest or anonymous — save in-memory and mark as guest
      guestStore.setGuest(true);
      guestStore.saveEntry({
        date:       today,
        promptText: prompt.text,
        promptType: prompt.type,
        items:      filled,
        createdAt:  new Date().toISOString(),
        updatedAt:  new Date().toISOString(),
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push('/');
    }, 2200);
  }

  async function handleAskMore() {
    const filled = items.filter(s => s.trim());
    if (!filled.length) return;
    const res = await fetch('/api/insights/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: filled, action: 'followup' }),
    });
    const data = await res.json();
    setFollowUp(data.question ?? null);
  }

  if (saved) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at top, #f8f1e0 0%, #ede2c5 50%, #d8c79f 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}>
        <div className="ink-reveal" style={{ textAlign: 'center' }}>
          <p className="font-display" style={{
            fontSize: '2rem',
            fontStyle: 'italic',
            color: 'var(--ink)',
            marginBottom: '0.5rem',
          }}>
            today is saved.
          </p>
          <p style={{
            fontFamily: 'Georgia, serif',
            color: 'var(--soft-ink)',
            fontSize: '0.9rem',
            letterSpacing: '0.06em',
          }}>
            see you tomorrow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
      <button
        onClick={() => router.push('/')}
        className="btn-ghost"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
      >
        ← back
      </button>

      {/* Prompt */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--accent)' }}>{PROMPT_ICONS[prompt.type]}</span>
          <span className="cat-label">{PROMPT_LABELS[prompt.type]}</span>
        </div>
        <h2 className="font-display" style={{
          fontStyle: 'italic',
          fontSize: '1.5rem',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.35,
        }}>
          {prompt.text}
        </h2>
      </div>

      {/* Six inputs */}
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        {items.map((val, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span className="font-hand" style={{
              fontSize: '1.1rem',
              color: 'var(--line)',
              minWidth: '1.25rem',
              userSelect: 'none',
            }}>
              {i + 1}
            </span>
            <input
              ref={el => { inputRefs.current[i] = el; }}
              className="ink-input"
              type="text"
              value={val}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              placeholder={i === 0 ? PLACEHOLDERS[0] : ''}
            />
          </div>
        ))}
      </div>

      {/* Follow-up AI question */}
      {followUp && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          borderLeft: '2px solid var(--accent-soft)',
          background: 'rgba(201,146,92,0.07)',
        }}>
          <p className="font-display" style={{
            fontStyle: 'italic',
            fontSize: '1rem',
            color: 'var(--soft-ink)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {followUp}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !items.some(s => s.trim())}
          style={{ flex: 1 }}
        >
          {saving ? 'saving...' : 'save the day'}
        </button>

        {session?.user && !followUp && (
          <button
            className="btn-ghost"
            onClick={handleAskMore}
            style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            ask me more
          </button>
        )}
      </div>

      <PageFooter />
    </div>
  );
}
