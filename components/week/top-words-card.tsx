'use client';

interface Props {
  words: Array<{ word: string; count: number }>;
}

export default function TopWordsCard({ words }: Props) {
  if (!words.length) return null;

  const max = Math.max(...words.map(w => w.count), 1);

  return (
    <div className="card-plain" style={{ marginBottom: '1.25rem' }}>
      <div className="cat-label" style={{ marginBottom: '0.75rem' }}>words you returned to</div>
      <div className="word-cloud">
        {words.map(({ word, count }) => {
          const scale = 0.75 + (count / max) * 0.85;
          return (
            <span
              key={word}
              className="font-hand"
              style={{
                fontSize: `${scale}rem`,
                color: count > 2 ? 'var(--accent)' : 'var(--soft-ink)',
                opacity: 0.7 + (count / max) * 0.3,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
