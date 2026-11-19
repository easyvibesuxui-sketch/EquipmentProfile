import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@sam/shared/setup';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
