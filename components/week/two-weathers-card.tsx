'use client';

import { useState } from 'react';
import { LIGHT_WORDS, HEAVY_WORDS } from '@/lib/insights';

interface Props {
  weather: { light: number; heavy: number; neutral: number };
  allItems: string[];
}

export default function TwoWeathersCard({ weather, allItems }: Props) {
  const [expanded, setExpanded] = useState<'light' | 'heavy' | null>(null);
  const total = weather.light + weather.heavy + weather.neutral || 1;

  const lightPct   = Math.round((weather.light   / total) * 100);
  const heavyPct   = Math.round((weather.heavy   / total) * 100);
  const neutralPct = 100 - lightPct - heavyPct;

  const lightItems  = allItems.filter(item => item.toLowerCase().split(/\W+/).some(w => LIGHT_WORDS.has(w)));
  const heavyItems  = allItems.filter(item => item.toLowerCase().split(/\W+/).some(w => HEAVY_WORDS.has(w)));

  function getObservation() {
    if (lightPct > 60)  return 'This was a lighter week.';
    if (heavyPct > 60)  return 'This was a heavier week.';
    if (neutralPct > 60) return 'A quiet, even week.';
    return 'A week of contrasts — light and heavy, held together.';
  }

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div className="cat-label" style={{ marginBottom: '0.75rem' }}>two weathers</div>

      {/* Stacked bar */}
      <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '0.75rem' }}>
        <div style={{ width: `${lightPct}%`, background: 'var(--sage)', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${neutralPct}%`, background: 'var(--line)' }} />
        <div style={{ width: `${heavyPct}%`, background: 'var(--clay)', transition: 'width 0.6s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'light',   count: weather.light,   pct: lightPct,   color: 'var(--sage)' },
          { label: 'neutral', count: weather.neutral, pct: neutralPct, color: 'var(--line)' },
          { label: 'heavy',   count: weather.heavy,   pct: heavyPct,   color: 'var(--clay)' },
        ].map(({ label, count, pct, color }) => (
          <button
            key={label}
            onClick={() => setExpanded(expanded === label as 'light' | 'heavy' ? null : label as 'light' | 'heavy')}
            style={{
              background: 'none', border: 'none', cursor: label !== 'neutral' ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
            }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: 'var(--soft-ink)' }}>
              {label} — {count} ({pct}%)
            </span>
          </button>
        ))}
      </div>

      {/* Expandable samples */}
      {expanded === 'light' && lightItems.length > 0 && (
        <div style={{ marginBottom: '0.75rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--sage)' }}>
          {lightItems.slice(0, 3).map((item, i) => (
            <p key={i} style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--soft-ink)', margin: '0.25rem 0' }}>
              "{item}"
            </p>
          ))}
        </div>
      )}
      {expanded === 'heavy' && heavyItems.length > 0 && (
        <div style={{ marginBottom: '0.75rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--clay)' }}>
          {heavyItems.slice(0, 3).map((item, i) => (
            <p key={i} style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--soft-ink)', margin: '0.25rem 0' }}>
              "{item}"
            </p>
          ))}
        </div>
      )}

      <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--soft-ink)', margin: 0 }}>
        {getObservation()}
      </p>
    </div>
  );
}
