'use client';

import Link from 'next/link';
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
        <Link href="/sign-in" style={{
          color: 'var(--accent)',
          fontFamily: 'Georgia, serif',
          fontSize: '0.8rem',
          textDecoration: 'underline',
        }}>
          Sign in to save your noticings.
        </Link>
      </p>
    </div>
  );
}
