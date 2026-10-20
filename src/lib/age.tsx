import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { prefs } from './prefs';

type Ctx = { ageConfirmed: boolean; confirmAge: () => void };
const AgeContext = createContext<Ctx | null>(null);

/** First-launch 21+ gate, remembered on the device. Account sign-up also asks for the birth date. */
export function AgeProvider({ children }: { children: ReactNode }) {
  const [ageConfirmed, setOk] = useState(() => prefs.get('age_ok') === '1');
  const value = useMemo(() => ({
    ageConfirmed,
    confirmAge: () => {
      prefs.set('age_ok', '1');
      setOk(true);
    },
  }), [ageConfirmed]);
  return <AgeContext.Provider value={value}>{children}</AgeContext.Provider>;
}

export function useAge() {
  const ctx = useContext(AgeContext);
  if (!ctx) throw new Error('useAge must be used inside AgeProvider');
  return ctx;
}
