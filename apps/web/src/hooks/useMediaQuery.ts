import { useEffect, useState } from 'react';

/**
 * Observa um media query via `matchMedia`. Usado pelo `ResponsivePanel`
 * para decidir Drawer (celular) vs Sheet/Dialog (tablet/desktop).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
