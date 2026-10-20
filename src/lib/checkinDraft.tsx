import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { Cigar, FlavorPick, Music, Pairing, Venue, Visibility } from './types';

export type ReviewScores = Partial<Record<'appearance' | 'draw' | 'burn' | 'flavor' | 'aroma' | 'overall', number>>;

export type CheckinDraft = {
  cigar: Pick<Cigar, 'id' | 'brand_name' | 'line' | 'vitola' | 'wrapper_shade'> | null;
  rating: number | null;
  note: string;
  photos: { uri: string; mime?: string }[];
  venue: Venue | null;
  eventTitle: string;
  atHome: boolean;
  pairings: Pairing[];
  music: Music | null;
  visibility: Visibility;
  scores: ReviewScores;
  strength: number | null;
  body: number | null;
  duration: number | null;
  flavors: FlavorPick[];
  clubId: string | null;
  humidorItemId: string | null;
};

const empty = (): CheckinDraft => ({
  cigar: null, rating: null, note: '', photos: [], venue: null, eventTitle: '', atHome: false, pairings: [],
  music: null, visibility: 'public', scores: {}, strength: null, body: null, duration: null, flavors: [],
  clubId: null, humidorItemId: null,
});

type Ctx = {
  draft: CheckinDraft;
  update: (patch: Partial<CheckinDraft>) => void;
  reset: (start?: Partial<CheckinDraft>) => void;
};

const DraftContext = createContext<Ctx | null>(null);

/** Keeps the check-in being written while the user moves between its sub-screens (place, music, review…). */
export function CheckinDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CheckinDraft>(empty);
  const update = useCallback((patch: Partial<CheckinDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback((start?: Partial<CheckinDraft>) => setDraft({ ...empty(), ...start }), []);
  const value = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useCheckinDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useCheckinDraft must be used inside CheckinDraftProvider');
  return ctx;
}

export function reviewTotal(s: ReviewScores) {
  const keys = ['appearance', 'draw', 'burn', 'flavor', 'aroma', 'overall'] as const;
  if (!keys.every((k) => typeof s[k] === 'number')) return null;
  return keys.reduce((sum, k) => sum + (s[k] ?? 0), 0);
}

export const SCORE_MAX = { appearance: 15, draw: 15, burn: 10, flavor: 30, aroma: 10, overall: 20 } as const;
