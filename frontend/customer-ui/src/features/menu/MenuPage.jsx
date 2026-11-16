import { useRef, useState } from 'react';
import { ArrowRight, Coffee, Minus, Plus, Search, TriangleAlert } from 'lucide-react';
import { useCart } from '../../app/CartContext';
import { useLiveRefetch } from '../../app/live/useLiveRefetch';
import { useNavigate } from '../../app/router';
import { MobileShell } from '../../app/shell/MobileShell';
import { formatMoney } from '../../shared/format';
import { useApiQuery } from '../../shared/hooks/useApiQuery';
import { BottomSheet, Button, EmptyMessage, Skeleton, MenuIcon } from '../../shared/ui';
import styles from './Menu.module.css';

/**
 * 3d — the menu: search, categories as horizontal chips (jump to the section), one product per
 * row (icon, no photos), + or a counter, and the fixed cart bar. Core sends only products that
 * can be ordered right now, grouped by active category in the manager's order.
 */
export function MenuPage() {
  const menu = useApiQuery('/api/participant/menu');
  const current = useApiQuery('/api/participant/sessions/current');
  useLiveRefetch(menu.refetch, ['menu.']);
  useLiveRefetch(current.refetch, ['session.']);
  const cart = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selected, setSelected] = useState(null);
  const sections = useRef(new Map());

  const blocked = current.data?.status === 'CHECKOUT_PENDING';
  const needle = query.trim().toLocaleLowerCase('ro');
  const categories = (menu.data ?? [])
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => !needle || i.name.toLocaleLowerCase('ro').includes(needle) || (i.description ?? '').toLocaleLowerCase('ro').includes(needle)),
    }))
    .filter((c) => c.items.length > 0);

  const jump = (id) => {
    setActiveCategory(id);
    sections.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cartBar =
    cart.count > 0 && !blocked ? (
      <button type="button" className={styles.cartBar} onClick={() => navigate('/cart')}>
        <span className={styles.cartCount}>{cart.count}</span>
        <span className={styles.cartText}>
          <span>{cart.editingOrderId ? `Modifici #C-${cart.editingOrderId}` : 'Coșul tău'}</span>
          <strong>{formatMoney(cart.total)}</strong>
        </span>
        <span className={styles.cartCta}>
          Vezi coșul <ArrowRight size={16} aria-hidden />
        </span>
      </button>
    ) : null;

  return (
    <MobileShell title="Meniu" footer={cartBar}>
      <label className={styles.search}>
        <Search size={18} aria-hidden />
        <input type="search" placeholder="Caută un produs…" aria-label="Caută un produs" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {blocked && (
        <p className={styles.blocked} role="status">
          <TriangleAlert size={18} aria-hidden /> Masa este în checkout, așa că nu se mai pot trimite comenzi noi.
        </p>
      )}

      {menu.loading && !menu.data ? (
        <MenuSkeleton />
      ) : menu.error && !menu.data ? (
        <EmptyMessage icon={Coffee} title="Nu am putut încărca meniul" action={<Button variant="secondary" onClick={menu.refetch}>Reîncearcă</Button>}>
          Verifică conexiunea și încearcă din nou.
        </EmptyMessage>
      ) : (
        <>
          <div className={styles.chips} role="tablist" aria-label="Categorii">
            {categories.map((c) => {
              const on = c.id === (activeCategory ?? categories[0]?.id);
              return (
                <button key={c.id} type="button" role="tab" aria-selected={on} className={`${styles.chip} ${on ? styles.chipOn : ''}`} onClick={() => jump(c.id)}>
                  {c.name}
                </button>
              );
            })}
          </div>

          {categories.length === 0 && <p className={styles.noMatch}>{needle ? 'Niciun produs nu se potrivește căutării.' : 'Meniul este gol momentan.'}</p>}

          {categories.map((c) => (
            <section key={c.id} ref={(el) => (el ? sections.current.set(c.id, el) : sections.current.delete(c.id))} className={styles.section}>
              <h2 className={styles.sectionTitle}>{c.name}</h2>
              {c.items.map((item) => (
                <ProductRow
                  key={item.id}
                  item={item}
                  quantity={cart.quantityOf(item.id)}
                  disabled={blocked}
                  onOpen={() => setSelected(item)}
                  onAdd={() => cart.setQuantity(item, cart.quantityOf(item.id) + 1)}
                />
              ))}
            </section>
          ))}
        </>
      )}

      {selected && (
        <ProductSheet
          key={selected.id}
          item={selected}
          initial={cart.quantityOf(selected.id) || 1}
          inCart={cart.quantityOf(selected.id) > 0}
          disabled={blocked}
          onClose={() => setSelected(null)}
          onConfirm={(quantity) => {
            cart.setQuantity(selected, quantity);
            setSelected(null);
          }}
        />
      )}
    </MobileShell>
  );
}

function ProductRow({ item, quantity, disabled, onOpen, onAdd }) {
  return (
    <div className={styles.product}>
      <button type="button" className={styles.productMain} onClick={onOpen}>
        <span className={styles.productIcon} aria-hidden>
          <MenuIcon name={item.icon} size={24} />
        </span>
        <span className={styles.productText}>
          <strong>{item.name}</strong>
          {item.description && <span>{item.description}</span>}
          <em>{formatMoney(item.price)}</em>
        </span>
      </button>
      {quantity > 0 ? (
        <span className={styles.counter}>
          <span aria-label={`${quantity} în coș`}>{quantity}</span>
          <button type="button" className={styles.add} onClick={onAdd} disabled={disabled} aria-label={`Încă un ${item.name}`}>
            <Plus size={18} />
          </button>
        </span>
      ) : (
        <button type="button" className={styles.add} onClick={onAdd} disabled={disabled} aria-label={`Adaugă ${item.name} în coș`}>
          <Plus size={18} />
        </button>
      )}
    </div>
  );
}

/** 4a — product sheet: the customer only chooses the quantity; the CTA shows the line total. */
function ProductSheet({ item, initial, inCart, disabled, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState(initial);
  return (
    <BottomSheet open onClose={onClose} label={item.name}>
      <div className={styles.sheetHead}>
        <span className={styles.sheetIcon} aria-hidden>
          <MenuIcon name={item.icon} size={34} />
        </span>
        <div>
          <h2 className={styles.sheetTitle}>{item.name}</h2>
          <p className={styles.sheetPrice}>{formatMoney(item.price)}</p>
        </div>
      </div>
      {item.description && <p className={styles.sheetText}>{item.description}</p>}
      {item.tags?.length > 0 && (
        <div className={styles.tags}>
          {item.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
      <div className={styles.quantityRow}>
        <span>Cantitate</span>
        <div className={styles.stepper}>
          <button type="button" onClick={() => setQuantity((q) => Math.max(inCart ? 0 : 1, q - 1))} aria-label="Mai puțin">
            <Minus size={18} />
          </button>
          <strong aria-live="polite">{quantity}</strong>
          <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Mai mult">
            <Plus size={18} />
          </button>
        </div>
      </div>
      <Button size="lg" fullWidth disabled={disabled} onClick={() => onConfirm(quantity)}>
        {quantity === 0 ? 'Scoate din coș' : `${inCart ? 'Actualizează coșul' : 'Adaugă în coș'} · ${formatMoney(Number(item.price) * quantity)}`}
      </Button>
    </BottomSheet>
  );
}

function MenuSkeleton() {
  return [1, 0.8, 0.55].map((opacity) => (
    <div key={opacity} className={styles.product} style={{ opacity }}>
      <Skeleton width={56} height={56} style={{ borderRadius: 999 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="35%" height={12} tone={2} />
      </div>
    </div>
  ));
}
