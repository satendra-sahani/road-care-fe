// ════════════════════════════════════════════════════════════
// BM Care — subscription store (client-side, ported from the
// customer-app prototype's `bmc_sub` localStorage model).
//
// This is a faithful port of the prototype: state lives in
// localStorage with no backend. Swap `bmCareStore.activate` for a
// real API call when the subscription backend lands.
// ════════════════════════════════════════════════════════════
import { useSyncExternalStore, useCallback } from 'react';

export interface SubPlan {
  id: 'care' | 'plus' | 'pro';
  name: string;
  em: string;
  tag: string | null;
  g1: string;
  g2: string;
  tagline: string;
  mo: number;
  yr: number;
  perks: string[];
}

export type Cycle = 'mo' | 'yr';

export const SUB_PLANS: SubPlan[] = [
  {
    id: 'care', name: 'BM Care', em: '🛡️', tag: null,
    g1: '#12A4B4', g2: '#0E8C9A', tagline: 'Essential cover for one vehicle',
    mo: 99, yr: 949,
    perks: ['2 free periodic services / year', 'Priority mechanic booking', '5% off all spare parts', 'Free pickup & drop', 'Smart service reminders'],
  },
  {
    id: 'plus', name: 'BM Care Plus', em: '⭐', tag: 'POPULAR',
    g1: '#2D5BA0', g2: '#1B3B6F', tagline: 'Best for daily riders & commuters',
    mo: 199, yr: 1899,
    perks: ['4 free periodic services / year', 'Priority booking + 4 free roadside / yr', '10% off all spare parts', 'Free pickup & drop', '1 free deep wash every quarter', 'Zero mechanic visit fee'],
  },
  {
    id: 'pro', name: 'BM Care Pro', em: '👑', tag: 'PREMIUM',
    g1: '#C8881C', g2: '#9A6410', tagline: 'Total cover for car + bike',
    mo: 349, yr: 3499,
    perks: ['6 free periodic services / year', 'Unlimited roadside assistance', '15% off all spare parts', 'Dedicated relationship manager', 'Free wash + interior sanitization', 'Covers up to 2 vehicles'],
  },
];

export interface BmcSub {
  plan: SubPlan['id'];
  cycle: Cycle;
  since: string;        // ISO activation date
  renew: string;        // ISO renewal date
  active: boolean;
  freeTotal: number;    // free services in the plan
  servicesUsed: number;
  roadTotal: number;    // -1 = unlimited
  roadUsed: number;
  partsDisc: number;    // % off spare parts
}

const KEY = 'bmc_sub';

export const planById = (id?: string): SubPlan => SUB_PLANS.find((p) => p.id === id) || SUB_PLANS[1];

export const fmtDate = (d: Date): string =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ── store ───────────────────────────────────────────────────
const read = (): BmcSub | null => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
};

let data: BmcSub | null = read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
const persist = () => {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore quota */ }
  }
};

export const bmCareStore = {
  subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; },
  get() { return data; },
  activate(plan: SubPlan['id'], cycle: Cycle) {
    const now = new Date();
    const renew = new Date(now);
    if (cycle === 'yr') renew.setFullYear(now.getFullYear() + 1);
    else renew.setMonth(now.getMonth() + 1);
    const freeTotal = ({ care: 2, plus: 4, pro: 6 } as const)[plan] ?? 2;
    const roadTotal = ({ care: 0, plus: 4, pro: -1 } as const)[plan];
    const partsDisc = ({ care: 5, plus: 10, pro: 15 } as const)[plan] ?? 5;
    data = {
      plan, cycle, since: now.toISOString(), renew: renew.toISOString(), active: true,
      freeTotal, servicesUsed: 1, roadTotal, roadUsed: 0, partsDisc,
    };
    persist(); emit();
  },
  cancel() { if (data) { data = { ...data, active: false }; persist(); emit(); } },
};

// ── hook ────────────────────────────────────────────────────
export function useBmCareSub(): BmcSub | null {
  const subscribe = useCallback((f: () => void) => bmCareStore.subscribe(f), []);
  const get = useCallback(() => bmCareStore.get(), []);
  // server snapshot is always null (no localStorage during SSR)
  return useSyncExternalStore(subscribe, get, () => null);
}
