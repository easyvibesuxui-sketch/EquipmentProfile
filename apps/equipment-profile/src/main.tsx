import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@sam/shared/setup';
import './styles/app.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
