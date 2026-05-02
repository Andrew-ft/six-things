'use client';

import { useState, useEffect, useRef } from 'react';
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

interface QuizQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuizQuestions(data: MonthData): QuizQuestion[] {
  const qs: QuizQuestion[] = [];

  // Q1: top word vs alternatives (data-specific)
  if (data.topWords.length >= 3) {
    const correct = data.topWords[0].word;
    const opts = shuffle([data.topWords[0].word, data.topWords[1].word, data.topWords[2].word]);
    qs.push({
      question: 'Which word came up most in what you wrote this month?',
      options: opts,
      correctIdx: opts.indexOf(correct),
      explanation: `"${correct}" appeared ${data.topWords[0].count} times — more than anything else you wrote.`,
    });
  } else {
    const { light, heavy } = data.weather;
    const correctIdx = light > heavy * 1.5 ? 0 : heavy > light * 1.5 ? 1 : 2;
    qs.push({
      question: 'How would you describe the mood of what you wrote this month?',
      options: ['mostly light', 'mostly heavy', 'a mix of both'],
      correctIdx,
      explanation: correctIdx === 0
        ? `Your words leaned lighter — ${light} lighter noticings vs ${heavy} heavier ones.`
        : correctIdx === 1
        ? `Your words leaned heavier — ${heavy} heavier noticings vs ${light} lighter ones.`
        : `Light and heavy in balance — ${light} lighter, ${heavy} heavier.`,
    });
  }

  // Q2: inward vs outward noticing
  const { inward, outward } = data.shape;
  const q2correct = inward > 60 ? 0 : outward > 60 ? 1 : 2;
  qs.push({
    question: 'When you notice things, you tend to look:',
    options: ['inward — feelings, thoughts', 'outward — people, the world', 'about the same'],
    correctIdx: q2correct,
    explanation: q2correct === 0
      ? `${inward}% of your language pointed inward this month.`
      : q2correct === 1
      ? `${outward}% of your language pointed outward this month.`
      : `Your gaze was balanced — ${inward}% inward, ${outward}% outward.`,
  });

  // Q3: emotional drift across the month
  const lateDiff = data.lateWeather.light - data.lateWeather.heavy;
  const earlyDiff = data.earlyWeather.light - data.earlyWeather.heavy;
  const q3correct = lateDiff > earlyDiff + 1 ? 0 : earlyDiff > lateDiff + 1 ? 1 : 2;
  qs.push({
    question: 'As the month went on, things felt:',
    options: ['lighter as it progressed', 'heavier as it progressed', 'roughly the same throughout'],
    correctIdx: q3correct,
    explanation: q3correct === 0
      ? 'Your later noticings had a lighter quality than your earlier ones.'
      : q3correct === 1
      ? 'Your earlier noticings were lighter; later ones carried more weight.'
      : 'The emotional tone of your noticings stayed fairly consistent.',
  });

  return qs;
}

function generateSelfPortrait(data: MonthData): string {
  const parts: string[] = [];
  parts.push(`This month you wrote ${data.daysWritten} ${data.daysWritten === 1 ? 'time' : 'times'}, noticing ${data.totalNoticings} small things.`);
  if (data.topWords[0]) {
    parts.push(`The word "${data.topWords[0].word}" came up most — ${data.topWords[0].count} ${data.topWords[0].count === 1 ? 'time' : 'times'}.`);
  }
  if (data.topWords[1] && data.topWords[2]) {
    parts.push(`You also kept returning to "${data.topWords[1].word}" and "${data.topWords[2].word}".`);
  }
  if (data.weather.light > data.weather.heavy * 1.5) {
    parts.push('Your noticings leaned toward the lighter.');
  } else if (data.weather.heavy > data.weather.light * 1.5) {
    parts.push('Your noticings carried some weight.');
  } else {
    parts.push('You held both light and heavy things.');
  }
  if (data.shape.inward > 65) {
    parts.push('You looked inward more than outward.');
  } else if (data.shape.outward > 65) {
    parts.push('You looked outward more than inward.');
  }
  if (data.innerVoice.length > 0) {
    const iv = data.innerVoice[0];
    parts.push(`You found yourself saying "${iv.phrase}" ${iv.count > 1 ? `${iv.count} times` : 'at least once'}.`);
  }
  return parts.join(' ');
}

const SCORE_PHRASES = [
  'Your words know you better than you know yourself.',
  "There's a gap between you and your words.",
  'You see most of yourself.',
  'You see yourself clearly.',
];

export default function MonthPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const guestStore = useGuestStore();

  const [data, setData] = useState<MonthData | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const questionsFetched = useRef(false);
  const [stage, setStage] = useState<'intro' | 'quiz' | 'reveal' | 'analysis'>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [letter, setLetter] = useState<string | null>(null);

  // Fetch month data
  useEffect(() => {
    if (session?.user) {
      fetch('/api/insights/month')
        .then(r => r.json())
        .then(d => setData(d))
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
        topWords:     getTopWords(allItems, 30),
        shape:        computeNoticiingShape(allItems),
        innerVoice:   getInnerVoicePhrases(allItems),
        weather:      classifyItems(allItems),
        earlyWeather: classifyItems(earlyItems),
        lateWeather:  classifyItems(lateItems),
        daysWritten:  entries.length,
        totalNoticings: allItems.length,
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, guestStore.isGuest]);

  // Generate quiz questions and portrait exactly once when data first loads
  useEffect(() => {
    if (!data || questionsFetched.current) return;
    questionsFetched.current = true;
    setQuestionsLoading(true);

    fetch('/api/insights/month/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(r => r.json())
      .then(d => {
        if (d.questions) setQuizQuestions(d.questions);
        if (d.portrait) setPortrait(d.portrait);
      })
      .catch(() => setQuizQuestions(generateQuizQuestions(data)))
      .finally(() => setQuestionsLoading(false));
  }, [data]);

  async function fetchLetter() {
    if (!data) return;
    try {
      const res = await fetch('/api/insights/month/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data.allItems.slice(0, 12) }),
      });
      const d = await res.json();
      if (d.letter) setLetter(d.letter);
    } catch {}
  }

  function handleAnswer(optIdx: number) {
    if (!quizQuestions.length) return;
    const q = quizQuestions[qIdx];
    const isMatch = optIdx === q.correctIdx;
    setAnswers(prev => [...prev, optIdx]);
    if (isMatch) setScore(s => s + 1);
    if (qIdx < quizQuestions.length - 1) {
      setTimeout(() => setQIdx(i => i + 1), 1200);
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
            <button
              className="btn-primary"
              onClick={() => setStage('quiz')}
              disabled={questionsLoading || quizQuestions.length === 0}
            >
              {questionsLoading ? 'preparing questions…' : 'begin →'}
            </button>
          ) : (
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: 'var(--soft-ink)' }}>
              write a few entries this month to unlock this view.
            </p>
          )}
        </div>
      )}

      {/* STAGE: QUIZ */}
      {stage === 'quiz' && quizQuestions.length > 0 && qIdx < quizQuestions.length && (
        <div className="card ink-reveal">
          <div className="cat-label" style={{ marginBottom: '1rem' }}>
            question {qIdx + 1} of {quizQuestions.length}
          </div>
          <p className="font-display" style={{
            fontStyle: 'italic', fontSize: '1.2rem', color: 'var(--ink)',
            marginBottom: '1.5rem', lineHeight: 1.5,
          }}>
            {quizQuestions[qIdx].question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {quizQuestions[qIdx].options.map((opt, i) => {
              const answered = answers.length > qIdx;
              const correct  = quizQuestions[qIdx].correctIdx;
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
                {answers[qIdx] === quizQuestions[qIdx].correctIdx ? 'this matches what you wrote. ' : 'a quiet difference. '}
                {quizQuestions[qIdx].explanation}
              </p>
              {qIdx < quizQuestions.length - 1 && (
                <button
                  className="btn-ghost"
                  style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                  onClick={() => setQIdx(i => i + 1)}
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
              {portrait || generateSelfPortrait(data)}
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
              <p className="font-hand" style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--ink)', margin: 0 }}>
                {letter}
              </p>
            ) : (
              <p className="font-display" style={{ fontStyle: 'italic', color: 'var(--soft-ink)', fontSize: '0.9rem' }}>
                generating your letter…
              </p>
            )}
          </div>
        </div>
      )}

      <PageFooter />
    </div>
  );
}
