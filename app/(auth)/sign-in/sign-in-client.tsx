'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGuestStore } from '@/lib/guest-store';

export default function SignInClient() {
  const router = useRouter();
  const setGuest = useGuestStore(s => s.setGuest);

  function handleGuest() {
    setGuest(true);
    router.push('/');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
        {/* Wordmark */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="font-display" style={{
            fontSize: '3rem',
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            margin: 0,
          }}>
            Six Things
          </h1>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.85rem',
            color: 'var(--soft-ink)',
            letterSpacing: '0.12em',
            marginTop: '0.5rem',
          }}>
            a quiet daily attention practice
          </p>
        </div>

        {/* Card */}
        <div className="card-plain" style={{ textAlign: 'left', padding: '2rem' }}>
          <p className="font-display" style={{
            fontStyle: 'italic',
            fontSize: '1.1rem',
            color: 'var(--soft-ink)',
            marginBottom: '2rem',
            lineHeight: 1.6,
          }}>
            *you don't have to find meaning. just notice.*
          </p>

          <button
            className="btn-primary"
            style={{ width: '100%', marginBottom: '1rem', fontSize: '0.95rem' }}
            onClick={() => signIn('google', { callbackUrl: '/' })}
          >
            Continue with Google
          </button>

          <button
            onClick={handleGuest}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'var(--soft-ink)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: '0.5rem',
              letterSpacing: '0.02em',
              textDecoration: 'underline',
              textDecorationColor: 'var(--line)',
            }}
          >
            continue as guest
          </button>
        </div>

        {/* Privacy note */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          color: 'var(--soft-ink)',
          opacity: 0.7,
          marginTop: '1.5rem',
          lineHeight: 1.6,
          letterSpacing: '0.02em',
        }}>
          We never share your data. You own everything you write.
        </p>

        <p className="page-footer" style={{ marginTop: '1rem' }}>
          nothing is shared · nothing is scored · ai never writes for you
        </p>
      </div>
    </div>
  );
}
