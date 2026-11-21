import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Brain, Check, ChevronRight, Clock, Handshake, Info, ListFilter, PartyPopper, RefreshCw, Sparkles, Swords, Timer, Users, X } from 'lucide-react';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { Button, EmptyMessage, Skeleton } from '../../shared/ui';
import { GameIcon } from './GameIcon';
import { DIFFICULTY, durationLong, players } from './gameModel';
import styles from './Games.module.css';

const QUESTIONS = [
  {
    key: 'people',
    title: 'Câți jucați?',
    options: [2, 3, 4, 5, 6].map((n) => ({ value: n, label: n === 6 ? '6 sau mai mulți' : `${n} jucători`, short: n === 6 ? '6+ jucători' : `${n} jucători`, icon: Users })),
  },
  {
    key: 'mood',
    title: 'Ce atmosferă vreți în seara asta?',
    options: [
      { value: 'FUN', label: 'Distracție și râsete', hint: 'Party, reguli scurte', icon: PartyPopper },
      { value: 'RELAXED', label: 'Strategie relaxată', hint: 'Gândire, dar fără stres', icon: Brain },
      { value: 'TEAM', label: 'Jucăm în echipă', hint: 'Cooperativ, toți contra jocului', icon: Handshake },
      { value: 'SERIOUS', label: 'Competiție serioasă', hint: 'Jocuri lungi, grele', icon: Swords },
    ],
  },
  {
    key: 'time',
    title: 'Cât timp aveți?',
    options: [
      { value: 30, label: 'Cam o jumătate de oră', short: 'Sub 30 min', icon: Timer },
      { value: 60, label: 'Cam o oră', short: 'Sub 60 min', icon: Clock },
      { value: null, label: 'Avem toată seara', short: 'Toată seara', icon: Clock },
    ],
  },
];

// Core waits at most 8 s for the AI Service, then answers with the fallback; this leaves room for that.
const RECOMMENDATIONS_TIMEOUT_MS = 15000;

/**
 * 4g / 4h / 4i — 3 questions, then recommendations from Core. Core picks the eligible games; the AI only
 * orders and explains them (4h). When the AI is unavailable Core returns source FALLBACK and the list is
 * labelled as such (4i), with "Încearcă din nou cu AI".
 */
export function RecommendationsPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  if (step === QUESTIONS.length) return <Results answers={answers} onRestart={() => setStep(0)} />;

  const q = QUESTIONS[step];
  const chosen = answers[q.key];
  return (
    <MobileShell title="Recomandări" back="/games">
      <div className={styles.progressBar} aria-hidden>
        {QUESTIONS.map((x, i) => (
          <span key={x.key} className={i <= step ? styles.progressOn : ''} />
        ))}
      </div>
      <p className={styles.muted}>
        Întrebarea {step + 1} din {QUESTIONS.length}
      </p>
      <h2 className={styles.question}>{q.title}</h2>
      <div className={styles.answers} role="radiogroup" aria-label={q.title}>
        {q.options.map((o) => {
          const Icon = o.icon;
          const on = chosen?.value === o.value;
          return (
            <button key={String(o.value)} type="button" role="radio" aria-checked={on} className={`${styles.answer} ${on ? styles.answerOn : ''}`} onClick={() => setAnswers((a) => ({ ...a, [q.key]: o }))}>
              <span className={styles.answerIcon} aria-hidden>
                <Icon size={20} />
              </span>
              <span>
                <strong>{o.label}</strong>
                {o.hint && <span>{o.hint}</span>}
              </span>
              {on && <Check size={20} className={styles.answerCheck} aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className={styles.wizardActions}>
        <button type="button" className={styles.roundButton} onClick={() => (step === 0 ? navigate('/games') : setStep(step - 1))} aria-label={step === 0 ? 'Renunță' : 'Înapoi'}>
          {step === 0 ? <X size={20} /> : <ArrowLeft size={20} />}
        </button>
        <Button size="lg" fullWidth disabled={!chosen} onClick={() => setStep(step + 1)}>
          {step === QUESTIONS.length - 1 ? 'Vezi recomandările' : 'Continuă'}
        </Button>
      </div>
    </MobileShell>
  );
}

function useRecommendations(answers, attempt) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const players = answers.people?.value;
  const mood = answers.mood?.value;
  const maxDurationMinutes = answers.time?.value ?? null;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    apiRequest('/api/participant/recommendations', {
      method: 'POST',
      body: { players, mood, maxDurationMinutes },
      signal: controller.signal,
      timeoutMs: RECOMMENDATIONS_TIMEOUT_MS,
    })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [players, mood, maxDurationMinutes, attempt]);

  return state;
}

function Results({ answers, onRestart }) {
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const { data, loading, error } = useRecommendations(answers, attempt);
  const retry = () => setAttempt((n) => n + 1);
  const items = data?.items ?? [];
  const isAi = data?.source === 'AI';

  return (
    <MobileShell title="Pentru voi" back="/games">
      <div className={styles.recoSummary}>
        {[answers.people?.short, answers.mood?.label, answers.time?.short].filter(Boolean).map((label) => (
          <span key={label}>{label}</span>
        ))}
        <button type="button" onClick={onRestart}>
          Modifică
        </button>
      </div>

      {loading ? (
        <>
          <p className={styles.muted} role="status">
            Căutăm cele mai potrivite jocuri pentru voi…
          </p>
          <Skeleton width="100%" height={150} />
          <Skeleton width="100%" height={150} />
        </>
      ) : error ? (
        <EmptyMessage icon={AlertCircle} title="Nu am putut încărca recomandările" action={<Button variant="secondary" onClick={retry}>Încearcă din nou</Button>}>
          {error.detail ?? 'Verificați conexiunea și încercați din nou.'}
        </EmptyMessage>
      ) : items.length === 0 ? (
        <EmptyMessage icon={ListFilter} title="Niciun joc liber potrivit" action={<Button variant="secondary" onClick={onRestart}>Schimbă răspunsurile</Button>}>
          Toate jocurile potrivite sunt la alte mese acum. Întrebați personalul sau încercați alte răspunsuri.
        </EmptyMessage>
      ) : isAi ? (
        <>
          {items.map(({ game, explanation }) => (
            <article key={game.id} className={styles.recoCard}>
              <div className={styles.cardHead}>
                <span className={styles.icon} aria-hidden>
                  <GameIcon id={game.id} size={26} />
                </span>
                <span className={styles.requestText}>
                  <strong>{game.title}</strong>
                  <span>
                    {players(game)} · {durationLong(game)} · {DIFFICULTY[game.difficulty]}
                  </span>
                </span>
              </div>
              <p className={styles.recoWhy}>
                <Sparkles size={16} aria-hidden />
                <span>{explanation}</span>
              </p>
              <Button variant="secondary" fullWidth onClick={() => navigate(`/games/${game.id}`)}>
                Vezi jocul
              </Button>
            </article>
          ))}
          <p className={styles.recoFootnote}>
            <Info size={14} aria-hidden />
            Sunt recomandate doar jocurile disponibile acum în cafenea.
          </p>
        </>
      ) : (
        <>
          <p className={styles.fallbackNote}>
            <ListFilter size={18} aria-hidden />
            <span>
              <strong>Sugestiile AI nu sunt disponibile acum.</strong> Mai jos sunt jocurile disponibile potrivite cu răspunsurile voastre: întâi cele potrivite cu atmosfera aleasă, apoi restul, alfabetic.
            </span>
          </p>
          {items.map(({ game }) => (
            <button key={game.id} type="button" className={styles.recoRow} onClick={() => navigate(`/games/${game.id}`)}>
              <span className={styles.icon} aria-hidden>
                <GameIcon id={game.id} size={24} />
              </span>
              <span className={styles.requestText}>
                <strong>{game.title}</strong>
                <span>
                  {players(game)} · {durationLong(game)} · {DIFFICULTY[game.difficulty]}
                </span>
              </span>
              <ChevronRight size={20} aria-hidden />
            </button>
          ))}
          <Button variant="secondary" size="lg" fullWidth onClick={retry}>
            <RefreshCw size={18} aria-hidden /> Încearcă din nou cu AI
          </Button>
        </>
      )}
    </MobileShell>
  );
}
