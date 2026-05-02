'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useGuestStore } from '@/lib/guest-store';
import PromptCard from '@/components/home/prompt-card';
import StreakCard from '@/components/home/streak-card';
import ThrowbackCard from '@/components/home/throwback-card';
import PageFooter from '@/components/shared/page-footer';
import type { Prompt } from '@/lib/prompts';

interface Props {
  prompt: Prompt;
  hasTodayEntry: boolean;
  streak: { current: number; longest: number };
  totalDays: number;
  totalNoticings: number;
  throwback: { item: string; date: string } | null;
  isGuest: boolean;
  userName: string | null;
  userEmail: string | null;
}

export default function HomeClient({
  prompt, hasTodayEntry, streak, totalDays, totalNoticings, throwback, isGuest, userName, userEmail,
}: Props) {
  const guestStore = useGuestStore();
  const guestEntries = guestStore.getEntries();
  const today = new Date().toISOString().slice(0, 10);
  const [showAccount, setShowAccount] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showGuest = isGuest && guestStore.isGuest;
  const effectiveTodayEntry = hasTodayEntry || (showGuest && !!guestStore.getEntryByDate(today));
  const effectiveTotalDays  = showGuest ? guestEntries.length : totalDays;
  const effectiveTotalNoticings = showGuest
    ? guestEntries.reduce((a, e) => a + e.items.length, 0)
    : totalNoticings;

  async function handleExport() {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'six-things-export.json'; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm('This will permanently delete your account and all your noticings. There is no undo. Are you sure?')) return;
    setDeleting(true);
    await fetch('/api/account', { method: 'DELETE' });
    signOut({ callbackUrl: '/sign-in' });
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>

      {/* Account bottom sheet */}
      {showAccount && (
        <div
          onClick={() => setShowAccount(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(58,46,34,0.35)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--paper)',
              borderRadius: '14px 14px 0 0',
              padding: '1.5rem 1.25rem 2.5rem',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle bar */}
            <div style={{ width: '36px', height: '4px', background: 'var(--line)', borderRadius: '2px', margin: '0 auto 1.25rem' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="font-display" style={{ fontStyle: 'italic', fontSize: '1.3rem', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
                account
              </h2>
              <button onClick={() => setShowAccount(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--soft-ink)', padding: '0.25rem 0.5rem' }}>
                ×
              </button>
            </div>

            {/* Signed in as */}
            <div className="card-plain" style={{ marginBottom: '1rem' }}>
              <div className="cat-label" style={{ marginBottom: '0.5rem' }}>signed in as</div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--soft-ink)', margin: 0 }}>
                {userEmail || userName || '—'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button className="btn-secondary" onClick={handleExport} style={{ textAlign: 'left' }}>
                export all my data (JSON)
              </button>
              <button
                className="btn-secondary"
                onClick={() => signOut({ callbackUrl: '/sign-in' })}
                style={{ textAlign: 'left' }}
              >
                sign out
              </button>
            </div>

            {/* Danger zone */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div className="cat-label" style={{ marginBottom: '0.5rem', color: 'var(--clay-deep)' }}>right to erasure</div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: 'var(--soft-ink)', marginBottom: '0.75rem' }}>
                Permanently deletes your account and all entries. Cannot be undone.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: 'none', border: '1px solid var(--clay)',
                  color: 'var(--clay-deep)', borderRadius: '3px',
                  padding: '0.5rem 1rem', fontFamily: 'Georgia, serif',
                  fontSize: '0.82rem', cursor: 'pointer', minHeight: '40px',
                }}
              >
                {deleting ? 'deleting…' : 'delete all my data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="font-display" style={{
              fontSize: '2.4rem', fontStyle: 'italic', fontWeight: 400,
              color: 'var(--ink)', margin: 0, lineHeight: 1,
            }}>
              Six Things
            </h1>
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: '0.82rem',
              color: 'var(--soft-ink)', letterSpacing: '0.06em', marginTop: '0.3rem',
            }}>
              you don't have to find meaning. just notice.
            </p>
          </div>

          <div style={{ textAlign: 'right', paddingTop: '0.25rem' }}>
            {showGuest ? (
              <Link href="/sign-in" style={{ textDecoration: 'none' }}>
                <button className="btn-ghost" style={{ fontSize: '0.78rem' }}>sign in</button>
              </Link>
            ) : (
              <button
                onClick={() => setShowAccount(true)}
                className="btn-ghost"
                style={{ fontSize: '0.78rem' }}
              >
                {userName ? userName.split(' ')[0] : 'account'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Today's Prompt */}
      <PromptCard prompt={prompt} hasTodayEntry={effectiveTodayEntry} />

      {/* Throwback */}
      {throwback && <ThrowbackCard item={throwback.item} date={throwback.date} />}

      {/* Streak */}
      <StreakCard current={streak.current} longest={streak.longest} />

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        <div className="card-plain" style={{ padding: '1rem', textAlign: 'center' }}>
          <div className="font-hand" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}>{effectiveTotalDays}</div>
          <div className="cat-label">days written</div>
        </div>
        <div className="card-plain" style={{ padding: '1rem', textAlign: 'center' }}>
          <div className="font-hand" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}>{effectiveTotalNoticings}</div>
          <div className="cat-label">small things noticed</div>
        </div>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[
          { href: '/week',      icon: '◷', label: 'this week' },
          { href: '/month',     icon: '◑', label: 'this month' },
          { href: '/look-back', icon: '⌛', label: 'look back' },
        ].map(({ href, icon, label }) => (
          <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%', flexDirection: 'column', gap: '0.2rem', padding: '0.75rem 0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.06em' }}>{label}</span>
            </button>
          </Link>
        ))}
      </div>

      {/* Settings */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/settings" style={{
          fontFamily: 'Georgia, serif', fontSize: '0.75rem',
          color: 'var(--soft-ink)', opacity: 0.6,
          letterSpacing: '0.1em', textDecoration: 'none',
        }}>
          settings
        </Link>
      </div>

      <PageFooter />
    </div>
  );
}
