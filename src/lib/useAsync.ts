import { useFocusEffect } from 'expo-router';
import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

type State<T> = { data: T | undefined; error: string | null; loading: boolean };

/**
 * Small data-loading hook: runs `fn` on mount and whenever `deps` change,
 * and again when the screen regains focus (so lists refresh after editing).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, opts: { refetchOnFocus?: boolean } = {}) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const mounted = useRef(true);
  const first = useRef(true);

  const run = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (mounted.current) setState({ data, error: null, loading: false });
    } catch (e) {
      if (mounted.current) setState((s) => ({ ...s, error: errorMessage(e), loading: false }));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (opts.refetchOnFocus !== false) run(true);
    }, [run, opts.refetchOnFocus]),
  );

  return { ...state, reload: () => run(true), setData: (d: T) => setState((s) => ({ ...s, data: d })) };
}

export function errorMessage(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}
