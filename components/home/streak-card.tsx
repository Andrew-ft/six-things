'use client';

const MILESTONES = [
  { days: 7,   icon: '🌱', label: 'a week' },
  { days: 30,  icon: '🌳', label: 'a month' },
  { days: 91,  icon: '🌲', label: 'a season' },
  { days: 365, icon: '🌌', label: 'a year' },
];

interface Props {
  current: number;
  longest: number;
}

export default function StreakCard({ current, longest }: Props) {
  const nextMilestone = MILESTONES.find(m => m.days > current) ?? MILESTONES[MILESTONES.length - 1];
  const prevMilestone = MILESTONES.filter(m => m.days <= current).pop();

  const progressStart = prevMilestone?.days ?? 0;
  const progressEnd   = nextMilestone.days;
  const progress      = Math.min(((current - progressStart) / (progressEnd - progressStart)) * 100, 100);

  return (
    <div className="card-plain fade-up" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div className="font-hand" style={{
            fontSize: '2.2rem',
            color: 'var(--accent)',
            lineHeight: 1,
          }}>
            {current}
          </div>
          <div className="cat-label" style={{ marginTop: '0.25rem' }}>
            {current === 1 ? 'day in a row' : 'days in a row'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.8rem',
            color: 'var(--soft-ink)',
          }}>
            longest run
          </div>
          <div className="font-hand" style={{
            fontSize: '1.4rem',
            color: 'var(--soft-ink)',
          }}>
            {longest}
          </div>
        </div>
      </div>

      {/* Milestone progress */}
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.35rem',
          fontFamily: 'Georgia, serif',
          fontSize: '0.72rem',
          color: 'var(--soft-ink)',
        }}>
          <span>{nextMilestone.icon} {nextMilestone.label}</span>
          <span>{Math.max(nextMilestone.days - current, 0)} days away</span>
        </div>
        <div className="streak-bar">
          <div className="streak-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* All milestones */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginTop: '0.75rem',
        flexWrap: 'wrap',
      }}>
        {MILESTONES.map(m => (
          <span key={m.days} style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.75rem',
            color: current >= m.days ? 'var(--accent)' : 'var(--line)',
            transition: 'color 0.3s',
          }}>
            {m.icon}
          </span>
        ))}
      </div>

      {current === 0 && (
        <p style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '0.8rem',
          color: 'var(--soft-ink)',
          marginTop: '0.75rem',
          marginBottom: 0,
        }}>
          if you miss a day, the streak rests — it doesn't reset to zero.
        </p>
      )}
    </div>
  );
}
