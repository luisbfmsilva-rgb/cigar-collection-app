import { useEffect, useRef, useState } from 'react';
import { errorMessage } from './useAsync';

/**
 * Debounced search: runs `fn(term)` 300 ms after the user stops typing.
 * Returns `data: null` while the term is shorter than `minLength`.
 */
export function useSearch<T>(q: string, fn: (term: string) => Promise<T[]>, { minLength = 2, delay = 300 } = {}) {
  const [state, setState] = useState<{ data: T[] | null; loading: boolean; error: string | null }>({ data: null, loading: false, error: null });
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    const term = q.trim();
    let cancelled = false;
    const id = setTimeout(async () => {
      if (term.length < minLength) {
        setState({ data: null, loading: false, error: null });
        return;
      }
      setState((s) => ({ ...s, loading: true }));
      try {
        const data = await fnRef.current(term);
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (e) {
        if (!cancelled) setState({ data: [], loading: false, error: errorMessage(e) });
      }
    }, term.length < minLength ? 0 : delay);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, minLength, delay]);

  return state;
}
