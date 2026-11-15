import {
  Ban,
  Check,
  ChefHat,
  CircleCheck,
  CircleDot,
  Hourglass,
  Receipt,
  Sparkle,
  Undo2,
  X,
} from 'lucide-react';

/**
 * Maps Core enums to the pastel status system of the handoff (tone + Romanian label + icon).
 * A status is never shown by colour alone.
 */
export const ORDER_STATUS = {
  PLACED: { tone: 'active', label: 'Nouă', icon: Sparkle },
  ACCEPTED: { tone: 'reserved', label: 'Acceptată', icon: Check },
  PREPARING: { tone: 'warning', label: 'În preparare', icon: ChefHat },
  READY: { tone: 'success', label: 'Gata', icon: CircleCheck },
  DELIVERED: { tone: 'success', label: 'Livrată', icon: Check },
  CANCELLED: { tone: 'neutral', label: 'Anulată', icon: X },
};

export const GAME_REQUEST_STATUS = {
  REQUESTED: { tone: 'warning', label: 'În așteptare', icon: Hourglass },
  RESERVED: { tone: 'reserved', label: 'Rezervat', icon: Check },
  DELIVERED: { tone: 'active', label: 'La masă', icon: CircleDot },
  RETURNED: { tone: 'neutral', label: 'Returnat', icon: Undo2 },
  REJECTED: { tone: 'error', label: 'Respinsă', icon: Ban },
  CANCELLED: { tone: 'neutral', label: 'Anulată', icon: X },
};

export const SESSION_STATUS = {
  ACTIVE: { tone: 'active', label: 'Activă', icon: CircleDot },
  CHECKOUT_PENDING: { tone: 'warning', label: 'Checkout', icon: Receipt },
  CLOSED: { tone: 'success', label: 'Plătită', icon: Check },
};

/**
 * Kitchen flow after acceptance: each status has exactly one next step (mirrors
 * OrderStatus.nextInPreparation in Core). Each transition is its own button (spec 2g).
 */
export const ORDER_NEXT_STEP = {
  ACCEPTED: { status: 'PREPARING', label: 'Începe prepararea', done: 'este în preparare' },
  PREPARING: { status: 'READY', label: 'Marchează gata', done: 'este gata' },
  READY: { status: 'DELIVERED', label: 'Marchează livrată', done: 'a fost livrată' },
};

/** All order statuses, for "everything of today" queries (the API defaults to open ones only). */
export const ALL_ORDER_STATUSES = Object.keys(ORDER_STATUS).join(',');
export const ALL_GAME_REQUEST_STATUSES = Object.keys(GAME_REQUEST_STATUS).join(',');
