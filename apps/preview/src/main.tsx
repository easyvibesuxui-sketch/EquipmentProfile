import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@sam/shared/setup';
import '../../equipment-profile/src/styles/app.css';
import { App as EquipmentProfile } from '../../equipment-profile/src/App';
import { App as Werkstatt } from '../../werkstatt/src/App';

/**
 * The review page: both apps in one file, one per hash. #werkstatt (and #werkstatt-empty for "No Board Yet")
 * opens the board; anything else (#profile, #empty, #no-camera, the other sidebar items) the Equipment Profile.
 * The sidebar's Planner and Werkstatt items switch between them (apps/preview/.env).
 */
function Preview() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => { setHash(window.location.hash); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (hash === '#werkstatt' || hash === '#werkstatt-empty') return <Werkstatt empty={hash === '#werkstatt-empty'} />;
  return <EquipmentProfile />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
