import { useState } from 'react';
import { ArrowLeft, Brain, Check, ChevronRight, Clock, Handshake, ListFilter, PartyPopper, Swords, Timer, Users, X } from 'lucide-react';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, EmptyMessage, Skeleton } from '../../shared/ui';
import { GameIcon } from './GameIcon';
import { DIFFICULTY, catalogPath, durationLong, players } from './gameModel';
import styles from './Games.module.css';

const QUESTIONS = [
  {
    key: 'people',
    title: 'Câți jucați?',
    options: [2, 3, 4, 5, 6].map((n) => ({ value: n, label: n === 6 ? '6 sau mai mulți' : `${n} jucători`, icon: Users })),
  },
  {
    key: 'mood',
    title: 'Ce atmosferă vreți în seara asta?',
    options: [
      { value: 'fun', label: 'Distracție și râsete', hint: 'Party, reguli scurte', icon: PartyPopper, difficulties: ['EASY'] },
      { value: 'relaxed', label: 'Strategie relaxată', hint: 'Gândire, dar fără stres', icon: Brain, difficulties: ['EASY', 'MEDIUM'] },
      { value: 'team', label: 'Jucăm în echipă', hint: 'Cooperativ, toți contra jocului', icon: Handshake, keyword: 'coop' },
      { value: 'serious', label: 'Competiție serioasă', hint: 'Jocuri lungi, grele', icon: Swords, difficulties: ['MEDIUM', 'HARD'] },
    ],
  },
  {
    key: 'time',
    title: 'Cât timp aveți?',
    options: [
      { value: 30, label: 'Cam o jumătate de oră', icon: Timer },
      { value: 60, label: 'Cam o oră', icon: Clock },
      { value: null, label: 'Avem toată seara', icon: Clock },
    ],
  },
];

/**
 * 4g / 4i — 3 questions, then recommendations. Core has no AI recommendation service, so the
 * results are always the deterministic fallback (4i): available games matching the answers,
 * alphabetical, and labelled as such. Nothing pretends to be an AI explanation.
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

function Results({ answers, onRestart }) {
  const navigate = useNavigate();
  const people = answers.people?.value;
  const time = answers.time?.value;
  const mood = answers.mood;
  const catalog = useApiQuery(catalogPath({ players: people === 6 ? null : people, maxDuration: time, availableOnly: true }));
  const categories = useApiQuery('/api/participant/game-categories');

  const coopIds = new Set((categories.data ?? []).filter((c) => mood?.keyword && c.name.toLowerCase().includes(mood.keyword)).map((c) => c.id));
  const games = (catalog.data?.content ?? [])
    .filter((g) => Number(g.availableCopies) > 0) // a recommendation must be something you can get now
    .filter((g) => (people === 6 ? g.maxPlayers >= 6 : true))
    .filter((g) => !mood?.difficulties || mood.difficulties.includes(g.difficulty))
    .filter((g) => !mood?.keyword || coopIds.size === 0 || [...(g.categoryIds ?? [])].some((id) => coopIds.has(id)))
    .sort((a, b) => a.title.localeCompare(b.title, 'ro'));

  return (
    <MobileShell title="Pentru voi" back="/games">
      <p className={styles.fallbackNote}>
        <ListFilter size={18} aria-hidden />
        <span>
          <strong>Sugestiile AI nu sunt disponibile.</strong> Mai jos sunt jocurile disponibile potrivite cu răspunsurile voastre, ordonate alfabetic.
        </span>
      </p>
      {catalog.loading && !catalog.data ? (
        <Skeleton width="100%" height={80} />
      ) : games.length === 0 ? (
        <EmptyMessage icon={ListFilter} title="Niciun joc liber potrivit" action={<Button variant="secondary" onClick={onRestart}>Schimbă răspunsurile</Button>}>
          Toate jocurile potrivite sunt la alte mese acum. Întrebați personalul sau încercați alte răspunsuri.
        </EmptyMessage>
      ) : (
        games.map((g) => (
          <button key={g.id} type="button" className={styles.recoRow} onClick={() => navigate(`/games/${g.id}`)}>
            <span className={styles.icon} aria-hidden>
              <GameIcon id={g.id} size={24} />
            </span>
            <span className={styles.requestText}>
              <strong>{g.title}</strong>
              <span>
                {players(g)} · {durationLong(g)} · {DIFFICULTY[g.difficulty]}
              </span>
            </span>
            <ChevronRight size={20} aria-hidden />
          </button>
        ))
      )}
      {games.length > 0 && (
        <Button variant="secondary" size="lg" fullWidth onClick={onRestart}>
          Schimbă răspunsurile
        </Button>
      )}
    </MobileShell>
  );
}
