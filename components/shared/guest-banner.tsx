'use client';

import { signIn } from 'next-auth/react';
import { useGuestStore } from '@/lib/guest-store';

export default function GuestBanner() {
  const isGuest = useGuestStore(s => s.isGuest);
  if (!isGuest) return null;

  return (
    <div style={{
      background: 'rgba(201, 146, 92, 0.12)',
      borderBottom: '1px solid var(--line)',
      padding: '0.6rem 1rem',
      textAlign: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '0.8rem',
        color: 'var(--soft-ink)',
        margin: 0,
        letterSpacing: '0.02em',
      }}>
        You're using Six Things as a guest.{' '}
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            fontSize: '0.8rem',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Sign in to save your noticings.
        </button>
      </p>
    </div>
  );
}
