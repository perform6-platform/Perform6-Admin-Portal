import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ContentProvider } from './context/ContentContext';
import { DeploymentsProvider } from './context/DeploymentsContext';
import { RotationScheduleProvider } from './context/RotationScheduleContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ensureRandomUuid } from './lib/createId';
import './index.css';

// HTTP on a public IP is not a secure context — crypto.randomUUID is missing.
ensureRandomUuid();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ContentProvider>
            <RotationScheduleProvider>
              <DeploymentsProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </DeploymentsProvider>
            </RotationScheduleProvider>
          </ContentProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
