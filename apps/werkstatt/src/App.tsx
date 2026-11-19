import { useEffect, useState } from 'react';
import { AppShell, appLinks } from '@sam/shared';
import { WerkstattPage } from './werkstatt/WerkstattPage';

/** `#empty` shows the "No Board Yet" state (Figma 1459:10561); replace with a real check once the API exists. */
function useEmptyDemo() {
  const read = () => window.location.hash === '#empty';
  const [empty, setEmpty] = useState(read);
  useEffect(() => {
    const on = () => setEmpty(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return empty;
}

export function App() {
  const empty = useEmptyDemo();
  return (
    <AppShell module="Werkstatt" current="werkstatt" links={appLinks}>
      <WerkstattPage key={String(empty)} startEmpty={empty} />
    </AppShell>
  );
}
