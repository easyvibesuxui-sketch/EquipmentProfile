import { useEffect, useState } from 'react';

/**
 * Review switch for the empty states: open the page with #empty to see the widgets with nothing linked
 * (no tracker, no connected entities). Replace with real data checks once the API exists.
 */
export function useEmptyDemo() {
  const read = () => typeof window !== 'undefined' && window.location.hash === '#empty';
  const [empty, setEmpty] = useState(read);
  useEffect(() => {
    const onHash = () => setEmpty(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return empty;
}
