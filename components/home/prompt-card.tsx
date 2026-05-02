'use client';

import Link from 'next/link';
import { PROMPT_ICONS, PROMPT_LABELS, type Prompt } from '@/lib/prompts';

interface Props {
  prompt: Prompt;
  hasTodayEntry: boolean;
}

export default function PromptCard({ prompt, hasTodayEntry }: Props) {
  const icon  = PROMPT_ICONS[prompt.type];
  const label = PROMPT_LABELS[prompt.type];

  return (
    <div className="card ink-reveal" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ color: 'var(--accent)', fontSize: '1rem' }}>{icon}</span>
        <span className="cat-label">{label}</span>
      </div>

      <h2 className="font-display" style={{
        fontStyle: 'italic',
        fontSize: '1.45rem',
        fontWeight: 400,
        color: 'var(--ink)',
        lineHeight: 1.35,
        margin: '0 0 1.25rem',
      }}>
        {prompt.text}
      </h2>

      {hasTodayEntry ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'Georgia, serif',
          fontSize: '0.85rem',
          color: 'var(--sage-deep)',
        }}>
          <span>✓</span>
          <span>today is saved. see you tomorrow.</span>
        </div>
      ) : (
        <Link
          href="/write"
          style={{ textDecoration: 'none' }}
          onClick={() => {
            try { sessionStorage.setItem('pending-write-prompt', JSON.stringify(prompt)); } catch {}
          }}
        >
          <button className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
            begin →
          </button>
        </Link>
      )}
    </div>
  );
}
