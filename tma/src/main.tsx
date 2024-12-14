import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { TelegramProvider } from './providers/TelegramProvider';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TelegramProvider>
      <App />
    </TelegramProvider>
  </StrictMode>
);