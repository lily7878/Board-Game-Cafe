import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileQuestion, MessageCircleOff, SendHorizontal } from 'lucide-react';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { describeError } from '../../shared/api/errors';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, EmptyMessage, Skeleton } from '../../shared/ui';
import styles from './Games.module.css';

const MAX_QUESTION = 300;
const HISTORY_TURNS = 4;
// Core waits up to 45 s for the AI Service (search + answer from the manual on a local model).
const ASK_TIMEOUT_MS = 50000;
const SUGGESTIONS = ['Cum se pregătește jocul?', 'Cum se câștigă?', 'Ce pot face într-o tură?'];

function pagesLabel(citations) {
  const pages = citations.map((c) => c.page);
  return pages.length === 1 ? `Manual, pagina ${pages[0]}` : `Manual, paginile ${pages.join(', ')}`;
}

/**
 * 4e — rules assistant: answers only from the game's manual, with the page under every answer.
 * 4f — when the manual is not READY the screen says so instead of answering.
 * The conversation lives only in this page's memory.
 */
export function RulesChatPage({ gameId }) {
  const navigate = useNavigate();
  const game = useApiQuery(`/api/participant/games/${gameId}`);
  const status = useApiQuery(`/api/participant/games/${gameId}/rules/status`);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [asking, setAsking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, asking]);

  const back = `/games/${gameId}`;
  const title = game.data ? `Reguli · ${game.data.title}` : 'Reguli';

  async function ask(text) {
    const question = text.trim().slice(0, MAX_QUESTION);
    if (!question || asking) return;
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.text }));
    setMessages((list) => [...list, { role: 'user', text: question }]);
    setDraft('');
    setAsking(true);
    try {
      const answer = await apiRequest(`/api/participant/games/${gameId}/rules/ask`, {
        method: 'POST',
        body: { question, history },
        timeoutMs: ASK_TIMEOUT_MS,
      });
      setMessages((list) => [...list, { role: 'assistant', text: answer.answer, found: answer.found, citations: answer.citations ?? [] }]);
    } catch (error) {
      if (error.status === 409) {
        setUnavailable(true); // the manual was removed or replaced meanwhile -> 4f
        return;
      }
      const text =
        error.status === 429
          ? `Prea multe întrebări. Încercați din nou peste ${error.retryAfter ?? 60} s.`
          : error.status === 503
            ? 'Asistentul nu răspunde acum. Încercați din nou peste puțin timp.'
            : describeError(error);
      setMessages((list) => [...list, { role: 'error', text, retry: question }]);
    } finally {
      setAsking(false);
    }
  }

  if ((status.loading && !status.data) || (game.loading && !game.data)) {
    return (
      <MobileShell title="Reguli" back={back}>
        <Skeleton width="100%" height={240} />
      </MobileShell>
    );
  }

  if (unavailable || !status.data?.available) {
    return (
      <MobileShell title={title} back={back}>
        <EmptyMessage icon={MessageCircleOff} title="Regulile nu sunt încă disponibile" action={<Button onClick={() => navigate(back)}>Înapoi la joc</Button>}>
          Manualul acestui joc nu a fost încărcat sau încă se procesează. Asistentul nu răspunde fără manual, ca să nu inventeze reguli. Personalul vă poate explica regulile.
        </EmptyMessage>
      </MobileShell>
    );
  }

  const footer = (
    <form
      className={styles.chatInput}
      onSubmit={(event) => {
        event.preventDefault();
        ask(draft);
      }}
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={MAX_QUESTION}
        placeholder="Întreabă despre reguli…"
        aria-label="Întrebare despre reguli"
        disabled={asking}
      />
      <button type="submit" disabled={asking || !draft.trim()} aria-label="Trimite întrebarea">
        <SendHorizontal size={20} />
      </button>
    </form>
  );

  return (
    <MobileShell title={title} back={back} footer={footer}>
      <p className={styles.chatNote}>
        <BookOpen size={16} aria-hidden /> Răspunsuri doar din manualul jocului.
      </p>

      <div className={styles.chat} aria-live="polite">
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>
            <FileQuestion size={28} aria-hidden />
            <span>Întrebați orice despre regulile jocului. Răspunsul vine din manual, cu pagina de unde l-am luat.</span>
          </div>
        )}
        {messages.map((m, index) =>
          m.role === 'user' ? (
            <div key={index} className={styles.bubbleUser}>
              {m.text}
            </div>
          ) : m.role === 'assistant' ? (
            <div key={index} className={`${styles.bubbleBot} ${m.found ? '' : styles.bubbleMuted}`}>
              <span>{m.text}</span>
              {m.found && m.citations.length > 0 && (
                <span className={styles.citation} title={m.citations.map((c) => `p. ${c.page}: ${c.excerpt}`).join('\n')}>
                  {pagesLabel(m.citations)}
                </span>
              )}
            </div>
          ) : (
            <div key={index} className={styles.bubbleError} role="alert">
              <span>{m.text}</span>
              {index === messages.length - 1 && (
                <button type="button" onClick={() => {
                  setMessages((list) => list.slice(0, -2));
                  ask(m.retry);
                }}>
                  Încearcă din nou
                </button>
              )}
            </div>
          ),
        )}
        {asking && (
          <div className={styles.typing} role="status" aria-label="Asistentul scrie">
            <i />
            <i />
            <i />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!asking && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
