'use client';

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
}

export default function HomeClient({
  prompt, hasTodayEntry, streak, totalDays, totalNoticings, throwback, isGuest, userName,
}: Props) {
  const guestStore = useGuestStore();
  const guestEntries = guestStore.getEntries();
  const today = new Date().toISOString().slice(0, 10);

  const showGuest = isGuest && guestStore.isGuest;
  const effectiveTodayEntry = hasTodayEntry || (showGuest && !!guestStore.getEntryByDate(today));
  const effectiveTotalDays  = showGuest ? guestEntries.length : totalDays;
  const effectiveTotalNoticings = showGuest
    ? guestEntries.reduce((a, e) => a + e.items.length, 0)
    : totalNoticings;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="font-display" style={{
              fontSize: '2.4rem',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'var(--ink)',
              margin: 0,
              lineHeight: 1,
            }}>
              Six Things
            </h1>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontSize: '0.82rem',
              color: 'var(--soft-ink)',
              letterSpacing: '0.06em',
              marginTop: '0.3rem',
            }}>
              you don't have to find meaning. just notice.
            </p>
          </div>

          <div style={{ textAlign: 'right', paddingTop: '0.25rem' }}>
            {showGuest ? (
              <Link href="/auth/sign-in" style={{ textDecoration: 'none' }}>
                <button className="btn-ghost" style={{ fontSize: '0.78rem' }}>
                  sign in
                </button>
              </Link>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
                className="btn-ghost"
                style={{ fontSize: '0.78rem' }}
              >
                {userName ? userName.split(' ')[0] : 'sign out'}
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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card-plain" style={{ padding: '1rem', textAlign: 'center' }}>
          <div className="font-hand" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}>
            {effectiveTotalDays}
          </div>
          <div className="cat-label">days written</div>
        </div>
        <div className="card-plain" style={{ padding: '1rem', textAlign: 'center' }}>
          <div className="font-hand" style={{ fontSize: '1.8rem', color: 'var(--accent)' }}>
            {effectiveTotalNoticings}
          </div>
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
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          color: 'var(--soft-ink)',
          opacity: 0.6,
          letterSpacing: '0.1em',
          textDecoration: 'none',
        }}>
          settings
        </Link>
      </div>

      <PageFooter />
    </div>
  );
}
