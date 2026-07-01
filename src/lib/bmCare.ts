// ════════════════════════════════════════════════════════════
// BM Care — subscription store. Plans + membership state hydrate
// from the backend (admin-managed PlanPricing + /user/membership);
// the localStorage cache below is the offline/SSR fallback so the
// page renders instantly and never breaks without the server.
// ════════════════════════════════════════════════════════════
import { useSyncExternalStore, useCallback } from 'react';
import Cookies from 'js-cookie';
import { publicPlansAPI, userMembershipAPI } from '@/services/api';

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

// ── server sync ─────────────────────────────────────────────
// Plan pricing (public) + the user's membership (authed) come from the
// backend; offline or logged-out, the local defaults/cache stand.
const REMOTE_KEY: Record<SubPlan['id'], string> = {
  care: 'bm_care',
  plus: 'bm_care_plus',
  pro: 'bm_care_pro',
};
export const planKeyById = (id: SubPlan['id']): string => REMOTE_KEY[id] || 'bm_care_plus';
const idByPlanKey = (key: string): SubPlan['id'] =>
  (Object.keys(REMOTE_KEY) as SubPlan['id'][]).find((k) => REMOTE_KEY[k] === key) || 'plus';

const membershipToSub = (m: any): BmcSub => ({
  plan: idByPlanKey(m.planKey),
  cycle: m.cycle === 'mo' ? 'mo' : 'yr',
  since: m.startedAt || new Date().toISOString(),
  renew: m.renewsAt || new Date().toISOString(),
  active: m.status === 'active',
  freeTotal: m.meta?.freeTotal ?? 2,
  servicesUsed: m.meta?.servicesUsed ?? 0,
  roadTotal: m.meta?.roadTotal ?? 0,
  roadUsed: m.meta?.roadUsed ?? 0,
  partsDisc: m.meta?.partsDisc ?? 5,
});

let plansLoaded = false;
let plansFetching = false;
const hydratePlansFromServer = async () => {
  if (plansLoaded || plansFetching || typeof window === 'undefined') return;
  plansFetching = true;
  try {
    const res = await publicPlansAPI.getPlans('membership');
    const list = res.data?.data;
    if (Array.isArray(list)) {
      plansLoaded = true;
      const byKey: Record<string, any> = {};
      for (const p of list) byKey[p.key] = p;
      let changed = false;
      for (const plan of SUB_PLANS) {
        const r = byKey[REMOTE_KEY[plan.id]];
        if (!r) continue;
        if (typeof r.priceMonthly === 'number') plan.mo = r.priceMonthly;
        if (typeof r.priceYearly === 'number') plan.yr = r.priceYearly;
        if (r.name) plan.name = r.name;
        if (r.tagline) plan.tagline = r.tagline;
        if (r.tag !== undefined) plan.tag = r.tag || null;
        if (Array.isArray(r.benefits) && r.benefits.length > 0) plan.perks = r.benefits;
        changed = true;
      }
      if (changed) { data = data ? { ...data } : data; emit(); }
    }
  } catch { /* offline — defaults stand; retried on next mount */ }
  finally { plansFetching = false; }
};

let subLoaded = false;
let subFetching = false;
const syncSubFromServer = async () => {
  if (subLoaded || subFetching || typeof window === 'undefined') return;
  // Only when logged in — an unauthenticated call would 401-redirect to /login.
  if (!Cookies.get('customer_token')) return;
  subFetching = true;
  try {
    const res = await userMembershipAPI.getMine();
    if (res.data?.success) {
      subLoaded = true;
      if (res.data.data) { data = membershipToSub(res.data.data); persist(); emit(); }
    }
  } catch { /* offline — cache stands; retried on next mount */ }
  finally { subFetching = false; }
};

export const bmCareStore = {
  subscribe(f: () => void) {
    hydratePlansFromServer(); // no-op once loaded
    syncSubFromServer();      // no-op once loaded / logged out
    listeners.add(f);
    return () => { listeners.delete(f); };
  },
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
      freeTotal, servicesUsed: 0, roadTotal, roadUsed: 0, partsDisc,
    };
    persist(); emit();
  },
  // Adopt a server membership (after payment verification)
  applyServerMembership(m: any) {
    if (!m) return;
    data = membershipToSub(m);
    subLoaded = true;
    persist(); emit();
  },
  cancel() {
    if (data) { data = { ...data, active: false }; persist(); emit(); }
    if (typeof window !== 'undefined' && Cookies.get('customer_token')) {
      userMembershipAPI.cancel().catch(() => { /* offline — local already reflects it */ });
    }
  },
};

// ── hook ────────────────────────────────────────────────────
export function useBmCareSub(): BmcSub | null {
  const subscribe = useCallback((f: () => void) => bmCareStore.subscribe(f), []);
  const get = useCallback(() => bmCareStore.get(), []);
  // server snapshot is always null (no localStorage during SSR)
  return useSyncExternalStore(subscribe, get, () => null);
}
