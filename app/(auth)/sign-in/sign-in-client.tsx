'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGuestStore } from '@/lib/guest-store';

type Mode = 'signin' | 'signup';

export default function SignInClient() {
  const router = useRouter();
  const setGuest = useGuestStore(s => s.setGuest);

  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleGuest() {
    setGuest(true);
    router.push('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email:    email.trim(),
      password,
      name:     name.trim(),
      mode,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        mode === 'signup'
          ? 'An account with that email already exists.'
          : 'Incorrect email or password.'
      );
    } else {
      router.push('/');
      router.refresh();
    }
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
            fontSize: '3rem', fontStyle: 'italic', fontWeight: 400,
            color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1, margin: 0,
          }}>
            Six Things
          </h1>
          <p style={{
            fontFamily: 'Georgia, serif', fontSize: '0.85rem',
            color: 'var(--soft-ink)', letterSpacing: '0.12em', marginTop: '0.5rem',
          }}>
            a quiet daily attention practice
          </p>
        </div>

        {/* Card */}
        <div className="card-plain" style={{ padding: '2rem', textAlign: 'left' }}>
          <p className="font-display" style={{
            fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--soft-ink)',
            marginBottom: '1.5rem', lineHeight: 1.6,
          }}>
            {mode === 'signin'
              ? 'welcome back.'
              : 'start your quiet practice.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.06em' }}>
                  your name
                </label>
                <input
                  className="ink-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="how shall we call you?"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.06em' }}>
                email
              </label>
              <input
                className="ink-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)', display: 'block', marginBottom: '0.3rem', letterSpacing: '0.06em' }}>
                password
              </label>
              <input
                className="ink-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'at least 6 characters' : '••••••••'}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: 'var(--clay-deep)', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? '…' : mode === 'signin' ? 'sign in' : 'create account'}
            </button>
          </form>

          {/* Toggle mode */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: '0.82rem',
                color: 'var(--soft-ink)', textDecoration: 'underline',
                textDecorationColor: 'var(--line)', padding: 0,
              }}
            >
              {mode === 'signin' ? 'no account yet? create one' : 'already have an account? sign in'}
            </button>
          </div>

          {/* Guest */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
            <button
              onClick={handleGuest}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: '0.82rem',
                color: 'var(--soft-ink)', opacity: 0.7, padding: 0,
              }}
            >
              continue as guest
            </button>
          </div>
        </div>

        {/* Privacy */}
        <p style={{
          fontFamily: 'Georgia, serif', fontSize: '0.75rem', color: 'var(--soft-ink)',
          opacity: 0.7, marginTop: '1.5rem', lineHeight: 1.6,
        }}>
          We never share your data. You own everything you write.
        </p>
        <p className="page-footer" style={{ marginTop: '0.5rem' }}>
          nothing is shared · nothing is scored · ai never writes for you
        </p>
      </div>
    </div>
  );
}
