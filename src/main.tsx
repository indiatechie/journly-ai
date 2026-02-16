import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@presentation/components/common/ErrorBoundary';
import { ToastContainer } from '@presentation/components/common/Toast';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer />
    </ErrorBoundary>
  </StrictMode>,
);

// Expose demo seeder in dev mode — run `seedDemo()` in browser console
if (import.meta.env.DEV) {
  import('@shared/demoSeed').then(({ seedDemo }) => {
    (window as unknown as Record<string, unknown>).seedDemo = seedDemo;
  });
}
