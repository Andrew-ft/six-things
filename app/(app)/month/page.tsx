'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGuestStore } from '@/lib/guest-store';
import { classifyItems, computeNoticiingShape, getInnerVoicePhrases, getTopWords } from '@/lib/insights';
import PageFooter from '@/components/shared/page-footer';

interface MonthData {
  entries: Array<{ date: string; items: string[]; promptText: string }>;
  allItems: string[];
  topWords: Array<{ word: string; count: number }>;
  shape: ReturnType<typeof computeNoticiingShape>;
  innerVoice: Array<{ phrase: string; count: number }>;
  weather: { light: number; heavy: number; neutral: number };
  earlyWeather: { light: number; heavy: number; neutral: number };
  lateWeather: { light: number; heavy: number; neutral: number };
  daysWritten: number;
  totalNoticings: number;
}

const QUIZ_QUESTIONS = [
  {
    question: "Most of my noticings this month were:",
    options: ['light and easy', 'heavy and hard', 'mixed — both'],
    dataKey: 'weather',
    getAnswer: (data: MonthData) => {
      const { light, heavy } = data.weather;
      if (light > heavy * 1.5) return 0;
      if (heavy > light * 1.5) return 1;
      return 2;
    },
    explanations: [
      (d: MonthData) => `Your words leaned light — ${d.weather.light} lighter noticings vs ${d.weather.heavy} heavier ones.`,
      (d: MonthData) => `Your words leaned heavy — ${d.weather.heavy} heavier noticings vs ${d.weather.light} lighter ones.`,
      (d: MonthData) => `Light and heavy in balance — ${d.weather.light} lighter, ${d.weather.heavy} heavier.`,
    ],
  },
  {
    question: "When I notice things, I tend to look:",
    options: ['inward (feelings, thoughts)', 'outward (people, world)', 'about the same'],
    dataKey: 'shape',
    getAnswer: (data: MonthData) => {
      if (data.shape.inward > 60) return 0;
      if (data.shape.outward > 60) return 1;
      return 2;
    },
    explanations: [
      (d: MonthData) => `${d.shape.inward}% of your language pointed inward.`,
      (d: MonthData) => `${d.shape.outward}% of your language pointed outward.`,
      (d: MonthData) => `Your gaze was balanced — ${d.shape.inward}% inward, ${d.shape.outward}% outward.`,
    ],
  },
  {
    question: "My month has been getting:",
    options: ['lighter as it went on', 'heavier as it went on', 'staying roughly the same'],
    dataKey: 'drift',
    getAnswer: (data: MonthData) => {
      const lateDiff = data.lateWeather.light - data.lateWeather.heavy;
      const earlyDiff = data.earlyWeather.light - data.earlyWeather.heavy;
      if (lateDiff > earlyDiff + 1) return 0;
      if (earlyDiff > lateDiff + 1) return 1;
      return 2;
    },
    explanations: [
      () => 'Your later noticings had a lighter quality than your earlier ones.',
      () => 'Your earlier noticings were lighter; later ones heavier.',
      () => 'The emotional quality of your noticings was fairly consistent.',
    ],
  },
];

const SCORE_PHRASES = [
  'Your words know you better than you know yourself.',
  'There\'s a gap between you and your words.',
  'You see most of yourself.',
  'You see yourself clearly.',
];

export default function MonthPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const guestStore = useGuestStore();

  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<'intro' | 'quiz' | 'reveal' | 'analysis'>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [letter, setLetter] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/insights/month')
        .then(r => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    } else if (guestStore.isGuest) {
      const today = new Date();
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const from  = first.toISOString().slice(0, 10);
      const entries = guestStore.getEntries()
        .filter(e => e.date >= from)
        .map(e => ({ date: e.date, items: e.items, promptText: e.promptText }));
      const allItems = entries.flatMap(e => e.items);
      const midpoint = Math.floor(entries.length / 2);
      const earlyItems = entries.slice(midpoint).flatMap(e => e.items);
      const lateItems  = entries.slice(0, midpoint).flatMap(e => e.items);
      setData({
        entries, allItems,
        topWords:  getTopWords(allItems, 30),
        shape:     computeNoticiingShape(allItems),
        innerVoice: getInnerVoicePhrases(allItems),
        weather:    classifyItems(allItems),
        earlyWeather: classifyItems(earlyItems),
        lateWeather:  classifyItems(lateItems),
        daysWritten: entries.length,
        totalNoticings: allItems.length,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session, guestStore.isGuest]);

  async function fetchLetter() {
    if (!data || !session?.user) return;
    const res = await fetch('/api/insights/month/letter', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: data.allItems.slice(0, 12) }),
    });
    const d = await res.json();
    setLetter(d.letter ?? null);
  }

  function handleAnswer(optIdx: number) {
    if (!data) return;
    const q = QUIZ_QUESTIONS[qIdx];
    const correct = q.getAnswer(data);
    const isMatch = optIdx === correct;
    const newAnswers = [...answers, optIdx];
    setAnswers(newAnswers);
    if (isMatch) setScore(s => s + 1);

    if (qIdx < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => setQIdx(q => q + 1), 1200);
    } else {
      setTimeout(() => setStage('reveal'), 1200);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)' }}>reading the month…</p>
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} className="btn-ghost">← back</button>
        <h1 className="font-display" style={{
          fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 400, color: 'var(--ink)', margin: 0,
        }}>
          this month
        </h1>
      </div>

      {/* STAGE: INTRO */}
      {stage === 'intro' && (
        <div className="card ink-reveal" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <p className="font-display" style={{
            fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)',
            lineHeight: 1.6, marginBottom: '2rem',
          }}>
            Three questions about who you think you are.<br />
            Then we'll show you what your own words say.
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--soft-ink)', marginBottom: '2rem' }}>
            nothing here is a verdict.
          </p>
          {data && data.totalNoticings > 0 ? (
            <button className="btn-primary" onClick={() => setStage('quiz')}>
              begin →
            </button>
          ) : (
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--soft-ink)' }}>
              write a few entries this month to unlock this view.
            </p>
          )}
        </div>
      )}

      {/* STAGE: QUIZ */}
      {stage === 'quiz' && data && qIdx < QUIZ_QUESTIONS.length && (
        <div className="card ink-reveal">
          <div className="cat-label" style={{ marginBottom: '1rem' }}>
            question {qIdx + 1} of {QUIZ_QUESTIONS.length}
          </div>
          <p className="font-display" style={{
            fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--ink)',
            marginBottom: '1.5rem', lineHeight: 1.5,
          }}>
            {QUIZ_QUESTIONS[qIdx].question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {QUIZ_QUESTIONS[qIdx].options.map((opt, i) => {
              const answered = answers.length > qIdx;
              const correct  = QUIZ_QUESTIONS[qIdx].getAnswer(data);
              const isThis   = answers[qIdx] === i;
              const isMatch  = correct === i;

              return (
                <button
                  key={i}
                  onClick={() => !answered && handleAnswer(i)}
                  disabled={answered}
                  style={{
                    background: answered
                      ? isThis
                        ? isMatch ? 'rgba(138,158,122,0.2)' : 'rgba(180,140,120,0.2)'
                        : isMatch ? 'rgba(138,158,122,0.08)' : 'transparent'
                      : 'transparent',
                    border: `1.5px solid ${answered && isMatch ? 'var(--sage)' : answered && isThis ? 'var(--clay)' : 'var(--line)'}`,
                    borderRadius: '3px',
                    padding: '0.75rem 1rem',
                    cursor: answered ? 'default' : 'pointer',
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.9rem',
                    color: 'var(--ink)',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{opt}</span>
                  {answered && isMatch && <span style={{ color: 'var(--sage)' }}>◐</span>}
                  {answered && isThis && !isMatch && <span style={{ color: 'var(--clay)' }}>◌</span>}
                </button>
              );
            })}
          </div>

          {answers.length > qIdx && (
            <div style={{ marginTop: '1.25rem', padding: '0.75rem 0', borderTop: '1px solid var(--line)' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--soft-ink)', margin: 0 }}>
                {answers[qIdx] === QUIZ_QUESTIONS[qIdx].getAnswer(data)
                  ? 'this matches what you wrote. '
                  : 'a quiet difference. '}
                {QUIZ_QUESTIONS[qIdx].explanations[QUIZ_QUESTIONS[qIdx].getAnswer(data)](data)}
              </p>
              {qIdx < QUIZ_QUESTIONS.length - 1 && (
                <button
                  className="btn-ghost"
                  style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                  onClick={() => setQIdx(q => q + 1)}
                >
                  next question →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* STAGE: REVEAL */}
      {stage === 'reveal' && data && (
        <div className="card ink-reveal" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
          <div className="font-hand" style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
            {score} / 3
          </div>
          <p className="font-display" style={{
            fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--ink)', marginBottom: '2rem',
          }}>
            {SCORE_PHRASES[score]}
          </p>
          <button className="btn-primary" onClick={() => { setStage('analysis'); fetchLetter(); }}>
            see your full portrait →
          </button>
        </div>
      )}

      {/* STAGE: ANALYSIS */}
      {stage === 'analysis' && data && (
        <div className="stagger">
          {/* Self Portrait */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="cat-label" style={{ marginBottom: '0.75rem' }}>🪞 self portrait</div>
            <p style={{ fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0, fontSize: '0.9rem', color: 'var(--soft-ink)' }}>
              This month you wrote {data.daysWritten} times, noticing {data.totalNoticings} small things.
              {data.topWords[0] && ` The word "${data.topWords[0].word}" appeared most — ${data.topWords[0].count} times.`}
              {data.weather.light > data.weather.heavy
                ? ' Your noticings leaned toward the lighter.'
                : data.weather.heavy > data.weather.light
                ? ' Your noticings carried some weight.'
                : ' You held both light and heavy things.'}
            </p>
          </div>

          {/* The Drift */}
          <div className="card-plain" style={{ marginBottom: '1.25rem' }}>
            <div className="cat-label" style={{ marginBottom: '0.75rem' }}>🌱 the drift</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', textAlign: 'center' }}>
              {[
                { label: 'early month', w: data.earlyWeather },
                { label: 'late month',  w: data.lateWeather },
              ].map(({ label, w }) => {
                const t = w.light + w.heavy + w.neutral || 1;
                return (
                  <div key={label}>
                    <div className="cat-label" style={{ marginBottom: '0.5rem' }}>{label}</div>
                    <div style={{ height: '60px', width: '40px', display: 'flex', flexDirection: 'column', margin: '0 auto', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ flex: w.light / t, background: 'var(--sage)' }} />
                      <div style={{ flex: w.neutral / t, background: 'var(--line)' }} />
                      <div style={{ flex: w.heavy / t, background: 'var(--clay)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Noticing Shape */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="cat-label" style={{ marginBottom: '1rem' }}>🧭 noticing shape</div>
            {[
              { label: 'inward', labelRight: 'outward', value: data.shape.inward },
              { label: 'sensory', labelRight: 'conceptual', value: data.shape.sensory },
              { label: 'light', labelRight: 'heavy', value: data.shape.light },
            ].map(({ label, labelRight, value }) => (
              <div key={label} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)' }}>{label}</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.78rem', color: 'var(--soft-ink)' }}>{labelRight}</span>
                </div>
                <div className="spectrum-bar">
                  <div className="spectrum-marker" style={{ left: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Inner Voice */}
          {data.innerVoice.length > 0 && (
            <div className="card-plain" style={{ marginBottom: '1.25rem' }}>
              <div className="cat-label" style={{ marginBottom: '0.75rem' }}>🎭 inner voice</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {data.innerVoice.slice(0, 4).map(({ phrase, count }) => (
                  <div key={phrase} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--soft-ink)' }}>
                      "{phrase}"
                    </span>
                    <span className="font-hand" style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>×{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Letter From Yourself */}
          <div className="card" style={{ marginBottom: '1.25rem', transform: 'rotate(-0.5deg)' }}>
            <div className="cat-label" style={{ marginBottom: '0.75rem' }}>💌 letter from yourself</div>
            {letter ? (
              <p className="font-hand" style={{
                fontSize: '1.1rem', lineHeight: 1.8,
                color: 'var(--ink)', margin: 0,
              }}>
                {letter}
              </p>
            ) : (
              <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)', fontSize: '0.9rem' }}>
                {session?.user
                  ? 'generating your letter…'
                  : 'sign in to receive your letter.'}
              </p>
            )}
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}
