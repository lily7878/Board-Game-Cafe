import { useState } from 'react';
import { ClipboardList, CloudOff, Minus, Plus, ShoppingBag, Trash2, TriangleAlert } from 'lucide-react';
import { useCart } from '../../app/CartContext';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { apiRequest } from '../../shared/api/http';
import { formatMoney } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { Button, EmptyMessage, MenuIcon } from '../../shared/ui';
import styles from './Cart.module.css';

/**
 * 3e / 3f — the cart on its own page. Sending is ONE request; Core prices every line.
 * After a timeout the outcome is unknown: the cart stays as it was, nothing is resent
 * automatically, and "Trimite din nou" warns that it may duplicate the order.
 */
export function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const menu = useApiQuery('/api/participant/menu');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Lines whose product disappeared from the menu (sold out / deactivated) cannot be sent.
  const orderable = new Map((menu.data ?? []).flatMap((c) => c.items).map((i) => [i.id, i]));
  const unavailable = menu.data ? cart.lines.filter((l) => !orderable.has(l.menuItemId)) : [];
  const editing = cart.editingOrderId;
  const unknown = Boolean(cart.unconfirmedSince);

  async function send() {
    setError(null);
    setSending(true);
    const body = { items: cart.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })) };
    try {
      const order = await apiRequest(editing ? `/api/participant/orders/${editing}` : '/api/participant/orders', {
        method: editing ? 'PUT' : 'POST',
        body,
      });
      cart.clear();
      navigate(`/orders?sent=${order?.id ?? ''}${editing ? '&edited=1' : ''}`, { replace: true });
    } catch (err) {
      setSending(false);
      if (err.isUncertain) {
        cart.markUnconfirmed();
      } else if (err.isConflict) {
        menu.refetch();
        setError(
          editing
            ? 'Personalul a preluat deja comanda, așa că nu mai poate fi modificată.'
            : /not available/i.test(err.detail ?? '')
              ? 'Un produs din coș nu mai este disponibil. L-am marcat mai jos; scoate-l și trimite din nou.'
              : 'Masa este în checkout, așa că nu se mai pot trimite comenzi noi.',
        );
      } else if (err.kind === 'network') {
        setError('Nu ne-am putut conecta. Comanda nu a plecat; încearcă din nou.');
      } else {
        setError('Comanda nu a putut fi trimisă.');
      }
    }
  }

  if (cart.lines.length === 0) {
    return (
      <MobileShell title="Coșul meu" back="/menu">
        <EmptyMessage icon={ShoppingBag} title="Coșul este gol" action={<Button onClick={() => navigate('/menu')}>Vezi meniul</Button>}>
          Alege din meniu ce vrei să comanzi.
        </EmptyMessage>
      </MobileShell>
    );
  }

  return (
    <MobileShell title={editing ? `Modifici #C-${editing}` : 'Coșul meu'} back="/menu">
      {unknown && (
        <div className={styles.unknown} role="alert">
          <CloudOff size={20} aria-hidden />
          <div>
            <strong>Nu am primit confirmarea</strong>
            <p>Comanda poate fi sau nu înregistrată. Coșul tău a rămas neschimbat.</p>
          </div>
        </div>
      )}

      <div className={styles.lines}>
        {cart.lines.map((line) => {
          const product = orderable.get(line.menuItemId);
          const missing = unavailable.includes(line);
          const price = Number(product?.price ?? line.price);
          return (
            <div key={line.menuItemId} className={`${styles.line} ${missing ? styles.lineMissing : ''}`}>
              <span className={styles.icon} aria-hidden>
                <MenuIcon name={product?.icon ?? line.icon} size={22} />
              </span>
              <div className={styles.lineText}>
                <strong>
                  {line.name}
                  {unknown && ` ×${line.quantity}`}
                </strong>
                {missing ? <span className={styles.missing}>Nu mai este disponibil</span> : <em>{formatMoney(price * line.quantity)}</em>}
              </div>
              {!unknown && (
                <div className={styles.stepper}>
                  <button type="button" onClick={() => cart.setQuantity(line, line.quantity - 1)} aria-label={line.quantity === 1 ? `Scoate ${line.name}` : `Mai puțin ${line.name}`}>
                    {line.quantity === 1 ? <Trash2 size={17} /> : <Minus size={17} />}
                  </button>
                  <strong>{line.quantity}</strong>
                  <button type="button" onClick={() => cart.setQuantity(line, line.quantity + 1)} disabled={missing || line.quantity >= 99} aria-label={`Mai mult ${line.name}`}>
                    <Plus size={17} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {unknown ? (
        <>
          <Button size="lg" fullWidth iconLeft={ClipboardList} onClick={() => navigate('/orders')}>
            Verifică Comenzile mele
          </Button>
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            submitting={sending}
            onClick={() => {
              cart.clearUnconfirmed();
              send();
            }}
          >
            Trimite din nou
          </Button>
          <p className={styles.warn}>
            <TriangleAlert size={16} aria-hidden /> Dacă prima comandă a ajuns, o retrimitere o poate dubla.
          </p>
        </>
      ) : (
        <>
          <button type="button" className={styles.addMore} onClick={() => navigate('/menu')}>
            <Plus size={18} aria-hidden /> Adaugă din meniu
          </button>
          <div className={styles.total}>
            <div>
              <span>Total</span>
              <strong>{formatMoney(cart.total)}</strong>
            </div>
            <p>Personalul confirmă fiecare produs. Dacă ceva nu mai e disponibil, poziția respectivă nu se plătește.</p>
          </div>
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
          <Button size="lg" fullWidth submitting={sending} disabled={unavailable.length > 0} onClick={send}>
            {editing ? 'Salvează modificarea' : 'Plasează comanda'}
          </Button>
          {editing && (
            <Button size="lg" fullWidth variant="ghost" onClick={() => { cart.stopEditing(); navigate('/orders'); }}>
              Renunță la modificare
            </Button>
          )}
        </>
      )}
    </MobileShell>
  );
}
