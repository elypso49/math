import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AccessProvider } from './features/access/access.context';
import { FamilyProvider } from './features/family/family.context';
import { SessionProvider } from './features/session/session.context';
import { AppRoutes } from './routes/AppRoutes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <FamilyProvider>
          <AccessProvider>
            <AppRoutes />
          </AccessProvider>
        </FamilyProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
