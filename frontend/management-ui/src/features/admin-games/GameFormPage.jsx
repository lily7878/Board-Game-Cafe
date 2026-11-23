import { useState } from 'react';
import { Check, FileText, Puzzle } from 'lucide-react';
import { useNavigate } from '../../app/router';
import { apiRequest } from '../../shared/api/http';
import { Button, Card, EmptyMessage, Input, Skeleton, Toggle, useToast } from '../../shared/ui';
import admin from '../admin/Admin.module.css';
import { DIFFICULTY } from './gameModel';
import { Breadcrumb } from './GameDetailPage';
import styles from './Games.module.css';

const EMPTY = {
  title: '',
  description: '',
  shortRules: '',
  minPlayers: '2',
  maxPlayers: '4',
  durationMinutes: '30',
  maxDurationMinutes: '',
  minimumAge: '8',
  difficulty: 'EASY',
  categoryIds: [],
  active: true,
};

const fromGame = (g) => ({
  title: g.title,
  description: g.description ?? '',
  shortRules: g.shortRules ?? '',
  minPlayers: String(g.minPlayers),
  maxPlayers: String(g.maxPlayers),
  durationMinutes: String(g.durationMinutes),
  maxDurationMinutes: g.maxDurationMinutes ? String(g.maxDurationMinutes) : '',
  minimumAge: String(g.minimumAge),
  difficulty: g.difficulty,
  categoryIds: [...(g.categoryIds ?? [])],
  active: g.active,
});

const int = (text) => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : null);

/** 7c — add / edit a game on a dedicated page. The game list waits for data before mounting the form. */
export function GameFormPage({ data, gameId }) {
  const game = gameId ? data.games.data?.find((g) => g.id === gameId) : null;
  if (gameId && !data.games.data) {
    return (
      <Card size="lg">
        <Skeleton width="40%" height={24} />
      </Card>
    );
  }
  if (gameId && !game) {
    return (
      <Card size="lg">
        <EmptyMessage icon={Puzzle} title="Jocul nu există">
          Poate a fost un link greșit.
        </EmptyMessage>
      </Card>
    );
  }
  return <GameForm key={gameId ?? 'new'} data={data} game={game} />;
}

function GameForm({ data, game }) {
  const isEdit = Boolean(game);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(() => (game ? fromGame(game) : EMPTY));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e?.target ? e.target.value : e }));
  const categories = (data.categories.data ?? []).filter((c) => c.active || form.categoryIds.includes(c.id));

  function validate() {
    const e = {};
    const min = int(form.minPlayers);
    const max = int(form.maxPlayers);
    const dur = int(form.durationMinutes);
    const maxDur = form.maxDurationMinutes.trim() ? int(form.maxDurationMinutes) : undefined;
    const age = int(form.minimumAge);
    if (!form.title.trim()) e.title = 'Scrie titlul jocului.';
    if (!form.description.trim()) e.description = 'Scrie o descriere scurtă; clienții o văd în catalog.';
    if (!min || min < 1) e.minPlayers = 'Minimum 1.';
    if (!max || (min && max < min)) e.maxPlayers = 'Cel puțin cât minimul.';
    if (!dur || dur < 1) e.durationMinutes = 'Minute, > 0.';
    if (maxDur === null || (maxDur !== undefined && dur && maxDur < dur)) e.maxDurationMinutes = 'Cel puțin cât durata.';
    if (age === null) e.minimumAge = 'Vârstă în ani.';
    setErrors(e);
    if (Object.keys(e).length) return null;
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      // Core treats null as "unchanged" on edit, so an emptied field is sent as "".
      shortRules: form.shortRules.trim(),
      minPlayers: min,
      maxPlayers: max,
      durationMinutes: dur,
      maxDurationMinutes: maxDur ?? null,
      minimumAge: age,
      difficulty: form.difficulty,
      categoryIds: form.categoryIds,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const body = validate();
    if (!body) return;
    setFormError(null);
    setSubmitting(true);
    let step = 'details';
    try {
      let saved;
      if (isEdit) {
        saved = await apiRequest(`/api/admin/games/${game.id}`, { method: 'PATCH', body });
      } else {
        saved = await apiRequest('/api/admin/games', { method: 'POST', body });
      }
      // Visibility is a separate endpoint; a new game is created active.
      const wasActive = isEdit ? game.active : true;
      if (form.active !== wasActive) {
        step = 'status';
        await apiRequest(`/api/admin/games/${saved.id}/status`, { method: 'PATCH', body: { active: form.active } });
      }
      toast.success(isEdit ? `${body.title} a fost salvat.` : `${body.title} a fost adăugat. Adaugă acum exemplarele lui.`);
      data.refetchAll();
      navigate(`/admin/games/${saved.id}`);
    } catch (error) {
      setSubmitting(false);
      data.refetchAll();
      if (step === 'status') setFormError('Detaliile au fost salvate, dar vizibilitatea în catalog nu. Încearcă din nou din lista de jocuri.');
      else if (error.isUncertain) setFormError('Serverul nu a confirmat salvarea. Verifică lista de jocuri înainte să încerci din nou.');
      else setFormError(error.detail ?? 'Jocul nu a putut fi salvat.');
    }
  }

  const toggleCategory = (id) =>
    setForm((f) => ({ ...f, categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((c) => c !== id) : [...f.categoryIds, id] }));

  return (
    <>
      <Breadcrumb current={isEdit ? game.title : 'Joc nou'} />
      <form className={styles.formLayout} onSubmit={handleSubmit} noValidate>
        <Card size="lg" className={styles.panel}>
          <h2 className={styles.panelTitleLg}>Detalii joc</h2>
          <div className={admin.form}>
            <Input label="Titlu" value={form.title} maxLength={150} onChange={set('title')} error={errors.title} autoFocus={!isEdit} />
            <div className={admin.field}>
              <label className={admin.fieldLabel} htmlFor="game-description">
                Descriere
              </label>
              <textarea id="game-description" className={admin.textarea} value={form.description} onChange={set('description')} aria-invalid={Boolean(errors.description)} />
              {errors.description && <span className={admin.fieldError}>{errors.description}</span>}
            </div>
            <div className={styles.numbers}>
              <Input label="Jucători min" inputMode="numeric" value={form.minPlayers} onChange={set('minPlayers')} error={errors.minPlayers} />
              <Input label="Jucători max" inputMode="numeric" value={form.maxPlayers} onChange={set('maxPlayers')} error={errors.maxPlayers} />
              <Input label="Durată (min)" inputMode="numeric" value={form.durationMinutes} onChange={set('durationMinutes')} error={errors.durationMinutes} />
              <Input label="Durată max" inputMode="numeric" placeholder="opțional" value={form.maxDurationMinutes} onChange={set('maxDurationMinutes')} error={errors.maxDurationMinutes} />
              <Input label="Vârstă" inputMode="numeric" suffix="+" value={form.minimumAge} onChange={set('minimumAge')} error={errors.minimumAge} />
            </div>
            <div className={admin.field}>
              <span className={admin.fieldLabel} id="game-difficulty">
                Dificultate
              </span>
              <div className={styles.segmented} role="radiogroup" aria-labelledby="game-difficulty">
                {Object.entries(DIFFICULTY).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={form.difficulty === value}
                    className={`${styles.segment} ${form.difficulty === value ? styles.segmentOn : ''}`}
                    onClick={() => set('difficulty')(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={admin.field}>
              <span className={admin.fieldLabel}>Categorii</span>
              <div className={styles.chipsWrap}>
                {categories.length === 0 && <span className={admin.small}>Nu există categorii; le poți adăuga din tab-ul Categorii.</span>}
                {categories.map((c) => {
                  const on = form.categoryIds.includes(c.id);
                  return (
                    <button key={c.id} type="button" aria-pressed={on} className={`${styles.pick} ${on ? styles.pickOn : ''}`} onClick={() => toggleCategory(c.id)}>
                      {on && <Check size={14} aria-hidden />} {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className={styles.formSide}>
          <Card size="lg" className={styles.panel}>
            <h3 className={styles.panelTitle}>Reguli pe scurt</h3>
            <textarea
              className={admin.textarea}
              style={{ minHeight: 140 }}
              aria-label="Reguli pe scurt"
              placeholder="Cum se joacă în câteva fraze: scopul, o tură, cum se câștigă."
              value={form.shortRules}
              onChange={set('shortRules')}
            />
            {/* <p className={styles.pdfNote}>
              <FileText size={16} aria-hidden /> Manualul PDF și asistentul de reguli nu sunt încă disponibile în backend; până atunci clienții văd aceste reguli pe scurt.
            </p> */}
          </Card>
          <Card size="lg" className={`${styles.panel} ${styles.visibility}`}>
            <Toggle label="Vizibil în catalogul clienților" checked={form.active} onChange={set('active')} />
          </Card>
          {formError && <div className={admin.formError} role="alert">{formError}</div>}
          <div className={admin.formActions}>
            <Button variant="secondary" onClick={() => navigate(isEdit ? `/admin/games/${game.id}` : '/admin/games')} disabled={submitting}>
              Anulează
            </Button>
            <Button type="submit" submitting={submitting}>
              Salvează jocul
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
