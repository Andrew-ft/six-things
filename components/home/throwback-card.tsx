'use client';

interface Props {
  item: string;
  date: string;
}

export default function ThrowbackCard({ item, date }: Props) {
  const d = new Date(date + 'T12:00:00');
  const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      borderLeft: '2px solid var(--line)',
      paddingLeft: '1rem',
      marginBottom: '1rem',
      opacity: 0.85,
    }}>
      <div className="cat-label" style={{ marginBottom: '0.4rem' }}>from before</div>
      <p className="font-display" style={{
        fontStyle: 'italic',
        fontSize: '1.05rem',
        color: 'var(--ink)',
        margin: 0,
        lineHeight: 1.5,
      }}>
        "{item}"
      </p>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '0.75rem',
        color: 'var(--soft-ink)',
        margin: '0.4rem 0 0',
      }}>
        {label}
      </p>
    </div>
  );
}
