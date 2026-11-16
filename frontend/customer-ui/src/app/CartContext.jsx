import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CART_KEY, useParticipant } from './ParticipantContext';

const CartContext = createContext(null);

const EMPTY = { lines: [], editingOrderId: null, unconfirmedSince: null };

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(CART_KEY)) };
  } catch {
    return EMPTY;
  }
}

/**
 * The cart of THIS phone (sessionStorage, survives a refresh, emptied when access ends).
 *   lines:            [{ menuItemId, name, price, icon, quantity }]  (price = what the menu showed;
 *                     Core computes the real totals)
 *   editingOrderId:   set by "Modifică" on a PLACED order -> sending replaces that order's lines
 *   unconfirmedSince: set after a timeout while sending (3f): the order may or may not exist,
 *                     so the cart is kept and nothing is resent automatically
 * Mounted with key = participant token (App), so a new identity always starts with a fresh cart.
 */
export function CartProvider({ children }) {
  const { participant } = useParticipant();
  const [cart, setCart] = useState(load);

  useEffect(() => {
    try {
      if (participant) sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // private mode: the cart lives in memory only
    }
  }, [cart, participant]);

  const setQuantity = useCallback((product, quantity) => {
    setCart((c) => {
      const others = c.lines.filter((l) => l.menuItemId !== product.id && l.menuItemId !== product.menuItemId);
      const id = product.menuItemId ?? product.id;
      if (quantity <= 0) return { ...c, lines: others };
      const existing = c.lines.find((l) => l.menuItemId === id);
      const line = { menuItemId: id, name: product.name, price: Number(product.price), icon: product.icon, quantity: Math.min(99, quantity) };
      // Keep the original position of a line whose quantity changes.
      return { ...c, lines: existing ? c.lines.map((l) => (l.menuItemId === id ? line : l)) : [...others, line] };
    });
  }, []);

  const value = useMemo(() => {
    const count = cart.lines.reduce((n, l) => n + l.quantity, 0);
    const total = cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return {
      ...cart,
      count,
      total,
      quantityOf: (menuItemId) => cart.lines.find((l) => l.menuItemId === menuItemId)?.quantity ?? 0,
      setQuantity,
      clear: () => setCart(EMPTY),
      /** "Modifică": the order's accepted-to-be lines become the cart. */
      editOrder: (order) =>
        setCart({
          lines: order.items.map((i) => ({ menuItemId: i.menuItemId, name: i.productName, price: Number(i.unitPrice), icon: null, quantity: i.quantity })),
          editingOrderId: order.id,
          unconfirmedSince: null,
        }),
      stopEditing: () => setCart(EMPTY),
      markUnconfirmed: () => setCart((c) => ({ ...c, unconfirmedSince: new Date().toISOString() })),
      clearUnconfirmed: () => setCart((c) => ({ ...c, unconfirmedSince: null })),
    };
  }, [cart, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
