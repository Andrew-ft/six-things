'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import PageFooter from '@/components/shared/page-footer';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    const res = await fetch('/api/export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'six-things-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm('This will permanently delete your account and all your noticings. There is no undo. Are you sure?')) return;
    setDeleting(true);
    await fetch('/api/account', { method: 'DELETE' });
    signOut({ callbackUrl: '/auth/sign-in' });
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} className="btn-ghost">← back</button>
        <h1 className="font-display" style={{
          fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 400, color: 'var(--ink)', margin: 0,
        }}>
          settings
        </h1>
      </div>

      {/* Privacy statement */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="cat-label" style={{ marginBottom: '0.75rem' }}>your privacy</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--soft-ink)', margin: 0 }}>
          Your noticings are private and will never be sold, shared, or used to train AI models.
          You own everything you write here. You can export or delete everything at any time.
        </p>
      </div>

      {/* Account */}
      {session?.user && (
        <div className="card-plain" style={{ marginBottom: '1.25rem' }}>
          <div className="cat-label" style={{ marginBottom: '0.75rem' }}>account</div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--soft-ink)', marginBottom: '1rem' }}>
            Signed in as {session.user.email}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={handleExport} style={{ textAlign: 'left' }}>
              export all my data (JSON)
            </button>
            <button
              className="btn-secondary"
              onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
              style={{ textAlign: 'left' }}
            >
              sign out
            </button>
          </div>
        </div>
      )}

      {/* Danger zone */}
      {session?.user && (
        <div className="card-plain" style={{ marginBottom: '1.25rem', borderLeft: '4px solid var(--clay)' }}>
          <div className="cat-label" style={{ marginBottom: '0.75rem', color: 'var(--clay-deep)' }}>
            right to erasure
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: 'var(--soft-ink)', marginBottom: '1rem' }}>
            Permanently deletes your account and all entries. This cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'none', border: '1px solid var(--clay)',
              color: 'var(--clay-deep)', borderRadius: '3px',
              padding: '0.6rem 1rem', fontFamily: 'Georgia, serif', fontSize: '0.85rem',
              cursor: 'pointer', minHeight: '44px',
            }}
          >
            {deleting ? 'deleting…' : 'delete all my data'}
          </button>
        </div>
      )}

      {/* Share */}
      <div className="card-plain" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
        <div className="cat-label" style={{ marginBottom: '0.75rem' }}>share six things</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.85rem', color: 'var(--soft-ink)', marginBottom: '1rem' }}>
          Share this app with someone who might need a quiet practice.
        </p>
        <a href="/share" style={{
          fontFamily: 'Georgia, serif', fontSize: '0.85rem',
          color: 'var(--accent)', textDecoration: 'none',
        }}>
          view QR code →
        </a>
      </div>

      <PageFooter />
    </div>
  );
}
