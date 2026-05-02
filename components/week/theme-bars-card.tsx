'use client';

const THEME_ICONS: Record<string, string> = {
  people: '◉', home: '⌂', weather: '☁', feelings: '○', nature: '✿', time: '◷',
};

interface Props {
  themes: Record<string, number>;
}

export default function ThemeBarsCard({ themes }: Props) {
  const max = Math.max(...Object.values(themes), 1);
  const entries = Object.entries(themes).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);

  if (!entries.length) return null;

  return (
    <div className="card-plain" style={{ marginBottom: '1.25rem' }}>
      <div className="cat-label" style={{ marginBottom: '0.75rem' }}>themes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {entries.map(([theme, count]) => (
          <div key={theme}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: 'var(--soft-ink)' }}>
                {THEME_ICONS[theme] ?? '·'} {theme}
              </span>
              <span className="font-hand" style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>{count}</span>
            </div>
            <div className="streak-bar">
              <div className="streak-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
