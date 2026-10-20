import { useEffect, useState } from 'react';
import { flavorReference } from './api';
import type { FlavorFamily, FlavorNote } from './types';

type Ref = { families: FlavorFamily[]; notes: FlavorNote[]; byCode: Map<string, FlavorNote>; familyByCode: Map<string, FlavorFamily> };
let cache: Ref | null = null;
let pending: Promise<Ref> | null = null;

async function load(): Promise<Ref> {
  if (cache) return cache;
  pending ??= flavorReference().then(({ families, notes }) => {
    cache = {
      families, notes,
      byCode: new Map(notes.map((n) => [n.code, n])),
      familyByCode: new Map(families.map((f) => [f.code, f])),
    };
    return cache;
  }).finally(() => {
    pending = null;
  });
  return pending;
}

/** The flavor wheel reference (families + notes), loaded once per app session. */
export function useFlavors() {
  const [ref, setRef] = useState<Ref | null>(cache);
  useEffect(() => {
    if (!cache) load().then(setRef).catch(() => {});
  }, []);
  return ref;
}
